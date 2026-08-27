-- =====================================================================
-- PHASE 06 — DOUBLE-ENTRY LEDGER, TRANSACTIONS & ACTIVITY ENGINE
-- =====================================================================

-- ---------- ENUMS ----------
CREATE TYPE public.ledger_account_class AS ENUM ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE');
CREATE TYPE public.ledger_side AS ENUM ('DEBIT','CREDIT');
CREATE TYPE public.ledger_account_status AS ENUM ('ACTIVE','INACTIVE','CLOSED');
CREATE TYPE public.ledger_transaction_status AS ENUM ('DRAFT','POSTED');
CREATE TYPE public.ledger_transaction_type AS ENUM ('ACCOUNT_OPENING','TRANSFER','FUNDING','FEE','REFUND','ADJUSTMENT','REVERSAL');
CREATE TYPE public.account_hold_status AS ENUM ('ACTIVE','RELEASED','CAPTURED','EXPIRED');

-- ---------- LEDGER ACCOUNTS ----------
CREATE TABLE public.ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  account_class public.ledger_account_class NOT NULL,
  normal_side public.ledger_side NOT NULL,
  currency text NOT NULL,
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  status public.ledger_account_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ledger_accounts_bank_account_currency_key
  ON public.ledger_accounts (bank_account_id, currency)
  WHERE bank_account_id IS NOT NULL;

GRANT ALL ON public.ledger_accounts TO service_role;
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
-- No customer-facing policy: raw chart of accounts is internal only.

-- ---------- LEDGER TRANSACTIONS ----------
CREATE TABLE public.ledger_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference text NOT NULL UNIQUE,
  transaction_type public.ledger_transaction_type NOT NULL,
  status public.ledger_transaction_status NOT NULL DEFAULT 'DRAFT',
  currency text NOT NULL,
  description text NOT NULL,
  source_type text NOT NULL,
  source_reference text,
  idempotency_key text NOT NULL UNIQUE,
  effective_at timestamptz NOT NULL DEFAULT now(),
  posted_at timestamptz,
  reversal_of uuid UNIQUE REFERENCES public.ledger_transactions(id) ON DELETE RESTRICT,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledger_transactions_posted_at_ck
    CHECK ((status = 'POSTED' AND posted_at IS NOT NULL) OR (status = 'DRAFT' AND posted_at IS NULL))
);
CREATE INDEX ledger_transactions_posted_at_idx ON public.ledger_transactions (posted_at DESC);
CREATE INDEX ledger_transactions_source_idx ON public.ledger_transactions (source_type, source_reference);
CREATE UNIQUE INDEX ledger_transactions_source_unique_idx
  ON public.ledger_transactions (source_type, source_reference)
  WHERE source_reference IS NOT NULL AND reversal_of IS NULL;

GRANT ALL ON public.ledger_transactions TO service_role;
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;

-- ---------- LEDGER ENTRIES ----------
CREATE TABLE public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_transaction_id uuid NOT NULL REFERENCES public.ledger_transactions(id) ON DELETE RESTRICT,
  ledger_account_id uuid NOT NULL REFERENCES public.ledger_accounts(id) ON DELETE RESTRICT,
  entry_side public.ledger_side NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL,
  line_number smallint NOT NULL CHECK (line_number > 0),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ledger_transaction_id, line_number)
);
CREATE INDEX ledger_entries_account_idx ON public.ledger_entries (ledger_account_id);
CREATE INDEX ledger_entries_transaction_idx ON public.ledger_entries (ledger_transaction_id);

GRANT ALL ON public.ledger_entries TO service_role;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- ---------- ACCOUNT HOLDS ----------
CREATE TABLE public.account_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL,
  status public.account_hold_status NOT NULL DEFAULT 'ACTIVE',
  reason_type text NOT NULL,
  source_reference text,
  idempotency_key text NOT NULL UNIQUE,
  expires_at timestamptz,
  released_at timestamptz,
  captured_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX account_holds_account_status_idx ON public.account_holds (account_id, status);

GRANT ALL ON public.account_holds TO service_role;
ALTER TABLE public.account_holds ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_updated_at_ledger_accounts BEFORE UPDATE ON public.ledger_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_account_holds BEFORE UPDATE ON public.account_holds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- IMMUTABILITY GUARDS ----------
CREATE OR REPLACE FUNCTION public.protect_posted_ledger_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'POSTED' THEN
      RAISE EXCEPTION 'posted ledger transactions cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'POSTED' THEN
    IF NEW.currency <> OLD.currency
       OR NEW.public_reference <> OLD.public_reference
       OR NEW.transaction_type <> OLD.transaction_type
       OR NEW.status <> OLD.status
       OR NEW.posted_at <> OLD.posted_at
       OR NEW.idempotency_key <> OLD.idempotency_key
       OR COALESCE(NEW.reversal_of::text,'') <> COALESCE(OLD.reversal_of::text,'') THEN
      RAISE EXCEPTION 'posted ledger transactions are immutable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_posted_ledger_transaction
  BEFORE UPDATE OR DELETE ON public.ledger_transactions
  FOR EACH ROW EXECUTE FUNCTION public.protect_posted_ledger_transaction();

CREATE OR REPLACE FUNCTION public.protect_ledger_entries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _status public.ledger_transaction_status;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT status INTO _status FROM public.ledger_transactions WHERE id = NEW.ledger_transaction_id;
    IF _status IS DISTINCT FROM 'DRAFT' THEN
      RAISE EXCEPTION 'entries can only be added to a draft ledger transaction';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'ledger entries are immutable';
END;
$$;

CREATE TRIGGER protect_ledger_entries_insert
  BEFORE INSERT ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.protect_ledger_entries();
CREATE TRIGGER protect_ledger_entries_write
  BEFORE UPDATE OR DELETE ON public.ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.protect_ledger_entries();

-- ---------- CHART OF ACCOUNTS (system accounts) ----------
INSERT INTO public.ledger_accounts (code, name, account_class, normal_side, currency)
VALUES
  ('CUSTOMER_DEPOSITS.TTD', 'Dépôts clients (agrégé)', 'LIABILITY', 'CREDIT', 'TTD'),
  ('SETTLEMENT_CLEARING.TTD', 'Compte de règlement', 'ASSET', 'DEBIT', 'TTD'),
  ('FEE_REVENUE.TTD', 'Produits de commissions', 'REVENUE', 'CREDIT', 'TTD'),
  ('ADJUSTMENT_CLEARING.TTD', 'Compte d''ajustement', 'EQUITY', 'CREDIT', 'TTD');

-- ---------- LEDGER ACCOUNT PROVISIONING FOR BANK ACCOUNTS ----------
CREATE OR REPLACE FUNCTION public.ensure_bank_account_ledger_account(_bank_account_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _acc public.bank_accounts;
  _ledger_id uuid;
BEGIN
  SELECT * INTO _acc FROM public.bank_accounts WHERE id = _bank_account_id;
  IF _acc.id IS NULL THEN
    RAISE EXCEPTION 'unknown bank account';
  END IF;

  SELECT id INTO _ledger_id FROM public.ledger_accounts
   WHERE bank_account_id = _acc.id AND currency = _acc.currency;
  IF _ledger_id IS NOT NULL THEN
    RETURN _ledger_id;
  END IF;

  INSERT INTO public.ledger_accounts (code, name, account_class, normal_side, currency, bank_account_id)
  VALUES (
    'CUSTOMER_DEPOSIT.' || _acc.public_reference || '.' || _acc.currency,
    'Dépôt client ' || _acc.public_reference,
    'LIABILITY', 'CREDIT', _acc.currency, _acc.id
  )
  RETURNING id INTO _ledger_id;

  RETURN _ledger_id;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_bank_account_ledger_account(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.provision_bank_account_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_bank_account_ledger_account(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER provision_bank_account_ledger
  AFTER INSERT ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.provision_bank_account_ledger();

-- Backfill existing accounts (no financial entries are created).
DO $$
DECLARE _id uuid;
BEGIN
  FOR _id IN SELECT id FROM public.bank_accounts LOOP
    PERFORM public.ensure_bank_account_ledger_account(_id);
  END LOOP;
END $$;

-- ---------- PUBLIC REFERENCE SEQUENCE ----------
CREATE SEQUENCE public.ledger_transaction_reference_seq;

CREATE OR REPLACE FUNCTION public.next_ledger_transaction_reference()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'TXN-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.ledger_transaction_reference_seq')::text, 8, '0');
$$;
REVOKE ALL ON FUNCTION public.next_ledger_transaction_reference() FROM PUBLIC;

-- ---------- BALANCE PROJECTION ----------
CREATE OR REPLACE FUNCTION public.recalculate_account_balance(_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _currency text;
  _ledger bigint;
  _held bigint;
BEGIN
  SELECT currency INTO _currency FROM public.bank_accounts WHERE id = _account_id FOR UPDATE;
  IF _currency IS NULL THEN
    RAISE EXCEPTION 'unknown bank account';
  END IF;

  -- Liability account: credits - debits (§42).
  SELECT COALESCE(SUM(
           CASE WHEN e.entry_side = 'CREDIT' THEN e.amount_minor ELSE -e.amount_minor END
         ), 0)
    INTO _ledger
    FROM public.ledger_entries e
    JOIN public.ledger_accounts la ON la.id = e.ledger_account_id
    JOIN public.ledger_transactions t ON t.id = e.ledger_transaction_id
   WHERE la.bank_account_id = _account_id
     AND la.currency = _currency
     AND t.status = 'POSTED';

  SELECT COALESCE(SUM(amount_minor), 0) INTO _held
    FROM public.account_holds
   WHERE account_id = _account_id AND status = 'ACTIVE';

  INSERT INTO public.account_balances AS b
    (account_id, currency, ledger_balance_minor, available_balance_minor, held_balance_minor, calculated_at, updated_at)
  VALUES (_account_id, _currency, _ledger, _ledger - _held, _held, now(), now())
  ON CONFLICT (account_id) DO UPDATE
    SET ledger_balance_minor = EXCLUDED.ledger_balance_minor,
        available_balance_minor = EXCLUDED.available_balance_minor,
        held_balance_minor = EXCLUDED.held_balance_minor,
        version = b.version + 1,
        calculated_at = now(),
        updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.recalculate_account_balance(uuid) FROM PUBLIC;

-- ---------- POSTING ENGINE ----------
-- _entries: [{ "ledgerAccountId": uuid, "side": "DEBIT"|"CREDIT", "amountMinor": 1000, "description": "..." }]
CREATE OR REPLACE FUNCTION public.post_ledger_transaction(
  _transaction_type public.ledger_transaction_type,
  _currency text,
  _description text,
  _source_type text,
  _source_reference text,
  _idempotency_key text,
  _entries jsonb,
  _created_by uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb,
  _reversal_of uuid DEFAULT NULL
)
RETURNS TABLE (id uuid, public_reference text, already_posted boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing public.ledger_transactions;
  _txn_id uuid;
  _reference text;
  _entry jsonb;
  _line smallint := 0;
  _debits bigint := 0;
  _credits bigint := 0;
  _account public.ledger_accounts;
  _amount bigint;
  _side public.ledger_side;
  _bank_id uuid;
BEGIN
  IF _idempotency_key IS NULL OR length(trim(_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'invalid idempotency key';
  END IF;
  IF _currency IS NULL OR length(_currency) <> 3 THEN
    RAISE EXCEPTION 'invalid currency';
  END IF;
  IF jsonb_typeof(_entries) <> 'array' OR jsonb_array_length(_entries) < 2 THEN
    RAISE EXCEPTION 'a journal requires at least two entries';
  END IF;

  -- Idempotency (§35 – §38): resolve to the existing financial result.
  SELECT * INTO _existing FROM public.ledger_transactions WHERE idempotency_key = _idempotency_key;
  IF _existing.id IS NOT NULL THEN
    RETURN QUERY SELECT _existing.id, _existing.public_reference, true;
    RETURN;
  END IF;

  _reference := public.next_ledger_transaction_reference();

  INSERT INTO public.ledger_transactions
    (public_reference, transaction_type, status, currency, description,
     source_type, source_reference, idempotency_key, effective_at, metadata, created_by, reversal_of)
  VALUES
    (_reference, _transaction_type, 'DRAFT', _currency, _description,
     _source_type, _source_reference, _idempotency_key, now(), COALESCE(_metadata, '{}'::jsonb), _created_by, _reversal_of)
  RETURNING ledger_transactions.id INTO _txn_id;

  FOR _entry IN SELECT * FROM jsonb_array_elements(_entries) LOOP
    _line := _line + 1;

    IF (_entry->>'side') NOT IN ('DEBIT','CREDIT') THEN
      RAISE EXCEPTION 'invalid entry side';
    END IF;
    _side := (_entry->>'side')::public.ledger_side;

    _amount := (_entry->>'amountMinor')::bigint;
    IF _amount IS NULL OR _amount <= 0 THEN
      RAISE EXCEPTION 'entry amount must be positive';
    END IF;

    SELECT * INTO _account FROM public.ledger_accounts
     WHERE id = (_entry->>'ledgerAccountId')::uuid FOR UPDATE;
    IF _account.id IS NULL THEN
      RAISE EXCEPTION 'unknown ledger account';
    END IF;
    IF _account.status <> 'ACTIVE' THEN
      RAISE EXCEPTION 'ledger account is not active';
    END IF;
    IF _account.currency <> _currency THEN
      RAISE EXCEPTION 'currency mismatch between journal and ledger account';
    END IF;

    INSERT INTO public.ledger_entries
      (ledger_transaction_id, ledger_account_id, entry_side, amount_minor, currency, line_number, description)
    VALUES (_txn_id, _account.id, _side, _amount, _currency, _line, _entry->>'description');

    IF _side = 'DEBIT' THEN _debits := _debits + _amount; ELSE _credits := _credits + _amount; END IF;
  END LOOP;

  IF _debits <> _credits THEN
    RAISE EXCEPTION 'unbalanced journal: debits % <> credits %', _debits, _credits;
  END IF;

  UPDATE public.ledger_transactions
     SET status = 'POSTED', posted_at = now()
   WHERE ledger_transactions.id = _txn_id;

  -- Projection update inside the same database transaction (§44).
  FOR _bank_id IN
    SELECT DISTINCT la.bank_account_id
      FROM public.ledger_entries e
      JOIN public.ledger_accounts la ON la.id = e.ledger_account_id
     WHERE e.ledger_transaction_id = _txn_id AND la.bank_account_id IS NOT NULL
  LOOP
    PERFORM public.recalculate_account_balance(_bank_id);
  END LOOP;

  RETURN QUERY SELECT _txn_id, _reference, false;
END;
$$;
REVOKE ALL ON FUNCTION public.post_ledger_transaction(
  public.ledger_transaction_type, text, text, text, text, text, jsonb, uuid, jsonb, uuid) FROM PUBLIC;

-- ---------- REVERSAL ----------
CREATE OR REPLACE FUNCTION public.reverse_ledger_transaction(
  _transaction_id uuid,
  _reason text,
  _created_by uuid DEFAULT NULL
)
RETURNS TABLE (id uuid, public_reference text, already_posted boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _original public.ledger_transactions;
  _entries jsonb;
BEGIN
  SELECT * INTO _original FROM public.ledger_transactions WHERE ledger_transactions.id = _transaction_id FOR UPDATE;
  IF _original.id IS NULL OR _original.status <> 'POSTED' THEN
    RAISE EXCEPTION 'only a posted transaction can be reversed';
  END IF;
  IF EXISTS (SELECT 1 FROM public.ledger_transactions WHERE reversal_of = _transaction_id) THEN
    RAISE EXCEPTION 'transaction already reversed';
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
           'ledgerAccountId', e.ledger_account_id,
           'side', CASE WHEN e.entry_side = 'DEBIT' THEN 'CREDIT' ELSE 'DEBIT' END,
           'amountMinor', e.amount_minor,
           'description', 'Contre-passation'
         ) ORDER BY e.line_number)
    INTO _entries
    FROM public.ledger_entries e
   WHERE e.ledger_transaction_id = _transaction_id;

  RETURN QUERY
  SELECT * FROM public.post_ledger_transaction(
    'REVERSAL',
    _original.currency,
    'Contre-passation de ' || _original.public_reference || COALESCE(' — ' || _reason, ''),
    'REVERSAL',
    _original.public_reference,
    'reversal:' || _transaction_id::text,
    _entries,
    _created_by,
    '{}'::jsonb,
    _transaction_id
  );
END;
$$;
REVOKE ALL ON FUNCTION public.reverse_ledger_transaction(uuid, text, uuid) FROM PUBLIC;

-- ---------- HOLDS ----------
CREATE OR REPLACE FUNCTION public.create_account_hold(
  _account_id uuid,
  _amount_minor bigint,
  _reason_type text,
  _source_reference text,
  _idempotency_key text,
  _expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing uuid;
  _currency text;
  _available bigint;
  _hold_id uuid;
BEGIN
  IF _amount_minor IS NULL OR _amount_minor <= 0 THEN
    RAISE EXCEPTION 'hold amount must be positive';
  END IF;

  SELECT id INTO _existing FROM public.account_holds WHERE idempotency_key = _idempotency_key;
  IF _existing IS NOT NULL THEN
    RETURN _existing;
  END IF;

  SELECT currency INTO _currency FROM public.bank_accounts WHERE id = _account_id FOR UPDATE;
  IF _currency IS NULL THEN
    RAISE EXCEPTION 'unknown bank account';
  END IF;

  SELECT available_balance_minor INTO _available FROM public.account_balances
   WHERE account_id = _account_id FOR UPDATE;
  IF COALESCE(_available, 0) < _amount_minor THEN
    RAISE EXCEPTION 'insufficient available balance';
  END IF;

  INSERT INTO public.account_holds
    (account_id, amount_minor, currency, reason_type, source_reference, idempotency_key, expires_at)
  VALUES (_account_id, _amount_minor, _currency, _reason_type, _source_reference, _idempotency_key, _expires_at)
  RETURNING id INTO _hold_id;

  PERFORM public.recalculate_account_balance(_account_id);
  RETURN _hold_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_account_hold(uuid, bigint, text, text, text, timestamptz) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.release_account_hold(_hold_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _hold public.account_holds;
BEGIN
  SELECT * INTO _hold FROM public.account_holds WHERE id = _hold_id FOR UPDATE;
  IF _hold.id IS NULL THEN
    RAISE EXCEPTION 'unknown hold';
  END IF;
  IF _hold.status <> 'ACTIVE' THEN
    RETURN; -- idempotent (§55)
  END IF;

  UPDATE public.account_holds
     SET status = 'RELEASED', released_at = now()
   WHERE id = _hold_id;

  PERFORM public.recalculate_account_balance(_hold.account_id);
END;
$$;
REVOKE ALL ON FUNCTION public.release_account_hold(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.capture_account_hold(_hold_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _hold public.account_holds;
BEGIN
  SELECT * INTO _hold FROM public.account_holds WHERE id = _hold_id FOR UPDATE;
  IF _hold.id IS NULL THEN
    RAISE EXCEPTION 'unknown hold';
  END IF;
  IF _hold.status = 'CAPTURED' THEN
    RETURN; -- idempotent
  END IF;
  IF _hold.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'hold is not active';
  END IF;

  UPDATE public.account_holds
     SET status = 'CAPTURED', captured_at = now()
   WHERE id = _hold_id;

  PERFORM public.recalculate_account_balance(_hold.account_id);
END;
$$;
REVOKE ALL ON FUNCTION public.capture_account_hold(uuid) FROM PUBLIC;

-- ---------- CUSTOMER-SAFE ACTIVITY VIEW ----------
-- Owned by the migration role, so underlying ledger RLS is bypassed while the
-- WHERE clause restricts every row to the signed-in customer's own accounts.
CREATE VIEW public.customer_account_activity AS
SELECT
  t.public_reference                                        AS reference,
  ba.user_id                                                AS user_id,
  ba.public_reference                                       AS account_reference,
  t.transaction_type::text                                  AS transaction_type,
  CASE WHEN e.entry_side = 'CREDIT' THEN 'INCOMING' ELSE 'OUTGOING' END AS direction,
  e.amount_minor                                            AS amount_minor,
  e.currency                                                AS currency,
  ba.currency_minor_unit                                    AS minor_unit,
  COALESCE(e.description, t.description)                    AS display_description,
  t.metadata->>'counterpartyDisplay'                        AS counterparty_display,
  CASE
    WHEN rev.id IS NOT NULL THEN 'REVERSED'
    WHEN t.transaction_type = 'REVERSAL' THEN 'COMPLETED'
    ELSE 'COMPLETED'
  END                                                       AS status,
  t.effective_at                                            AS occurred_at,
  t.posted_at                                               AS completed_at,
  t.source_type                                             AS source_type,
  e.id                                                      AS entry_id
FROM public.ledger_entries e
JOIN public.ledger_transactions t ON t.id = e.ledger_transaction_id
JOIN public.ledger_accounts la ON la.id = e.ledger_account_id
JOIN public.bank_accounts ba ON ba.id = la.bank_account_id
LEFT JOIN public.ledger_transactions rev ON rev.reversal_of = t.id
WHERE t.status = 'POSTED'
  AND ba.user_id = auth.uid();

GRANT SELECT ON public.customer_account_activity TO authenticated;

-- ---------- CUSTOMER MONTHLY AGGREGATE ----------
CREATE OR REPLACE FUNCTION public.customer_monthly_activity_summary(
  _account_reference text,
  _period_start timestamptz,
  _period_end timestamptz
)
RETURNS TABLE (money_in_minor bigint, money_out_minor bigint, operation_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN a.direction = 'INCOMING' THEN a.amount_minor ELSE 0 END), 0)::bigint,
    COALESCE(SUM(CASE WHEN a.direction = 'OUTGOING' THEN a.amount_minor ELSE 0 END), 0)::bigint,
    COUNT(*)::bigint
  FROM public.customer_account_activity a
  WHERE a.account_reference = _account_reference
    AND a.occurred_at >= _period_start
    AND a.occurred_at < _period_end;
$$;
GRANT EXECUTE ON FUNCTION public.customer_monthly_activity_summary(text, timestamptz, timestamptz) TO authenticated;

-- ---------- INTEGRITY CHECK (internal / admin only) ----------
CREATE OR REPLACE FUNCTION public.check_balance_projection_integrity()
RETURNS TABLE (account_id uuid, ledger_computed bigint, projection_value bigint, matches boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ba.id,
    COALESCE(l.computed, 0)::bigint,
    COALESCE(b.ledger_balance_minor, 0)::bigint,
    COALESCE(l.computed, 0) = COALESCE(b.ledger_balance_minor, 0)
  FROM public.bank_accounts ba
  LEFT JOIN public.account_balances b ON b.account_id = ba.id
  LEFT JOIN (
    SELECT la.bank_account_id AS account_id,
           SUM(CASE WHEN e.entry_side = 'CREDIT' THEN e.amount_minor ELSE -e.amount_minor END) AS computed
      FROM public.ledger_entries e
      JOIN public.ledger_accounts la ON la.id = e.ledger_account_id
      JOIN public.ledger_transactions t ON t.id = e.ledger_transaction_id
     WHERE t.status = 'POSTED' AND la.bank_account_id IS NOT NULL
     GROUP BY la.bank_account_id
  ) l ON l.account_id = ba.id;
$$;
REVOKE ALL ON FUNCTION public.check_balance_projection_integrity() FROM PUBLIC;