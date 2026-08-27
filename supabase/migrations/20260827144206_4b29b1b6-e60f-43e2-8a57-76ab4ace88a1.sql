-- ============================================================
-- PHASE 05 — Bank accounts + server-managed balance projection
-- ============================================================

CREATE TYPE public.bank_account_type AS ENUM ('CURRENT', 'SAVINGS');

CREATE TYPE public.bank_account_status AS ENUM (
  'PENDING', 'ACTIVE', 'RESTRICTED', 'SUSPENDED', 'FROZEN', 'CLOSING', 'CLOSED'
);

CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_reference text NOT NULL UNIQUE,
  account_type public.bank_account_type NOT NULL DEFAULT 'CURRENT',
  display_name text NOT NULL DEFAULT 'Compte personnel',
  currency text NOT NULL DEFAULT 'TTD',
  currency_minor_unit smallint NOT NULL DEFAULT 2,
  status public.bank_account_status NOT NULL DEFAULT 'PENDING',
  is_primary boolean NOT NULL DEFAULT false,
  account_number text NOT NULL UNIQUE,
  bank_code text,
  branch_code text,
  bic text,
  iban text UNIQUE,
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bank_accounts_currency_iso CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT bank_accounts_minor_unit_range CHECK (currency_minor_unit BETWEEN 0 AND 4)
);

CREATE INDEX bank_accounts_user_id_idx ON public.bank_accounts (user_id);
CREATE INDEX bank_accounts_user_status_idx ON public.bank_accounts (user_id, status);
-- One primary account per customer.
CREATE UNIQUE INDEX bank_accounts_one_primary_per_user
  ON public.bank_accounts (user_id) WHERE is_primary;

GRANT SELECT ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts select own or staff"
  ON public.bank_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE TRIGGER bank_accounts_set_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- Balance projection (read model). Never mutated by customers.
-- ------------------------------------------------------------
CREATE TABLE public.account_balances (
  account_id uuid PRIMARY KEY REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  currency text NOT NULL,
  ledger_balance_minor bigint NOT NULL DEFAULT 0,
  available_balance_minor bigint NOT NULL DEFAULT 0,
  held_balance_minor bigint NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_balances_held_non_negative CHECK (held_balance_minor >= 0)
);

GRANT SELECT ON public.account_balances TO authenticated;
GRANT ALL ON public.account_balances TO service_role;
ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "balances select via account ownership"
  ON public.account_balances FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bank_accounts a
    WHERE a.id = account_balances.account_id
      AND (a.user_id = auth.uid() OR public.is_staff(auth.uid()))
  ));

CREATE TRIGGER account_balances_set_updated_at
  BEFORE UPDATE ON public.account_balances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- Account status history (auditability)
-- ------------------------------------------------------------
CREATE TABLE public.account_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_status public.bank_account_status,
  new_status public.bank_account_status NOT NULL,
  reason_category text,
  internal_note text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX account_status_history_account_idx
  ON public.account_status_history (account_id, created_at DESC);

GRANT SELECT ON public.account_status_history TO authenticated;
GRANT ALL ON public.account_status_history TO service_role;
ALTER TABLE public.account_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account history select own or staff"
  ON public.account_status_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- ------------------------------------------------------------
-- Server-side identifier generation
-- ------------------------------------------------------------
CREATE SEQUENCE public.bank_account_serial START 481;

CREATE OR REPLACE FUNCTION public.next_account_public_reference()
RETURNS text
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'ACC-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.bank_account_serial')::text, 6, '0');
$$;

REVOKE ALL ON FUNCTION public.next_account_public_reference() FROM PUBLIC;
REVOKE ALL ON SEQUENCE public.bank_account_serial FROM PUBLIC;

-- ------------------------------------------------------------
-- Idempotent initial provisioning for ACTIVE customers only.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.provision_primary_account(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lifecycle public.customer_lifecycle_state;
  _account_id uuid;
  _reference text;
  _number text;
BEGIN
  IF _user_id IS NULL OR auth.uid() IS DISTINCT FROM _user_id THEN
    RAISE EXCEPTION 'not authorised';
  END IF;

  SELECT lifecycle_state INTO _lifecycle FROM public.profiles WHERE id = _user_id;
  IF _lifecycle IS NULL OR _lifecycle <> 'ACTIVE' THEN
    RETURN NULL;
  END IF;

  -- Idempotent: an existing account short-circuits provisioning.
  SELECT id INTO _account_id
  FROM public.bank_accounts
  WHERE user_id = _user_id
  ORDER BY is_primary DESC, created_at
  LIMIT 1;

  IF _account_id IS NOT NULL THEN
    RETURN _account_id;
  END IF;

  _reference := public.next_account_public_reference();
  _number := '30' || lpad((floor(random() * 100000000)::bigint)::text, 8, '0');

  INSERT INTO public.bank_accounts (
    user_id, public_reference, account_type, display_name, currency,
    currency_minor_unit, status, is_primary, account_number,
    bank_code, branch_code, bic, opened_at
  ) VALUES (
    _user_id, _reference, 'CURRENT', 'Compte personnel', 'TTD',
    2, 'ACTIVE', true, _number,
    '099', '0001', 'RBTTTTPXXX', now()
  )
  RETURNING id INTO _account_id;

  -- Controlled zero opening balance: no funds are ever seeded.
  INSERT INTO public.account_balances (account_id, currency)
  VALUES (_account_id, 'TTD');

  INSERT INTO public.account_status_history (
    account_id, user_id, previous_status, new_status, reason_category
  ) VALUES (_account_id, _user_id, NULL, 'ACTIVE', 'ACCOUNT_OPENED');

  RETURN _account_id;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_primary_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_primary_account(uuid) TO authenticated, service_role;