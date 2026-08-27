-- =====================================================================
-- PHASE 07 — BENEFICIARIES & INTERNAL TRANSFERS
-- The ledger (PHASE 06) stays the single financial source of truth.
-- =====================================================================

CREATE TYPE public.beneficiary_type AS ENUM ('INTERNAL_CUSTOMER','EXTERNAL_BANK');
CREATE TYPE public.beneficiary_status AS ENUM ('ACTIVE','DISABLED','REMOVED','PENDING_VERIFICATION');
CREATE TYPE public.transfer_status AS ENUM (
  'DRAFT','READY_FOR_CONFIRMATION','CONFIRMED','FUNDS_RESERVED','PROCESSING',
  'COMPLIANCE_REVIEW','DOCUMENT_REQUIRED','APPROVED','COMPLETED','FAILED',
  'CANCELLED','BLOCKED','REVERSED'
);
CREATE TYPE public.transfer_actor_type AS ENUM ('CUSTOMER','SYSTEM','STAFF','COMPLIANCE');

-- ---------- BENEFICIARIES ----------
CREATE TABLE public.beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_reference text NOT NULL UNIQUE,
  beneficiary_type public.beneficiary_type NOT NULL DEFAULT 'INTERNAL_CUSTOMER',
  display_name text NOT NULL,
  nickname text,
  destination_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  destination_account_masked text NOT NULL,
  destination_currency text NOT NULL,
  destination_bank_type text NOT NULL DEFAULT 'INTERNAL',
  status public.beneficiary_status NOT NULL DEFAULT 'ACTIVE',
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX beneficiaries_active_destination_key
  ON public.beneficiaries (user_id, destination_account_id)
  WHERE status <> 'REMOVED' AND destination_account_id IS NOT NULL;
CREATE INDEX beneficiaries_user_idx ON public.beneficiaries (user_id, status);

GRANT SELECT ON public.beneficiaries TO authenticated;
GRANT ALL ON public.beneficiaries TO service_role;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beneficiaries select own"
ON public.beneficiaries FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE TRIGGER set_updated_at_beneficiaries BEFORE UPDATE ON public.beneficiaries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- TRANSFERS ----------
CREATE TABLE public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference text NOT NULL UNIQUE,
  sender_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  source_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  beneficiary_id uuid REFERENCES public.beneficiaries(id) ON DELETE RESTRICT,
  destination_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency text NOT NULL,
  customer_reference text,
  status public.transfer_status NOT NULL DEFAULT 'DRAFT',
  processing_stage text,
  idempotency_key text NOT NULL UNIQUE,
  -- Customer-safe snapshots so history survives beneficiary removal (§150-§152).
  recipient_display_snapshot text NOT NULL,
  destination_masked_snapshot text NOT NULL,
  source_masked_snapshot text NOT NULL,
  ledger_transaction_id uuid UNIQUE REFERENCES public.ledger_transactions(id) ON DELETE RESTRICT,
  hold_id uuid REFERENCES public.account_holds(id) ON DELETE RESTRICT,
  failure_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  processing_started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz
);
CREATE INDEX transfers_sender_created_idx ON public.transfers (sender_user_id, created_at DESC);
CREATE INDEX transfers_source_account_idx ON public.transfers (source_account_id, status);

GRANT SELECT ON public.transfers TO authenticated;
GRANT ALL ON public.transfers TO service_role;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfers select own"
ON public.transfers FOR SELECT TO authenticated
USING (auth.uid() = sender_user_id OR public.is_staff(auth.uid()));

CREATE TRIGGER set_updated_at_transfers BEFORE UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- TRANSFER STATUS HISTORY ----------
CREATE TABLE public.transfer_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  from_status public.transfer_status,
  to_status public.transfer_status NOT NULL,
  reason_code text,
  actor_type public.transfer_actor_type NOT NULL DEFAULT 'SYSTEM',
  actor_reference uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transfer_status_history_transfer_idx
  ON public.transfer_status_history (transfer_id, created_at);

GRANT SELECT ON public.transfer_status_history TO authenticated;
GRANT ALL ON public.transfer_status_history TO service_role;
ALTER TABLE public.transfer_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfer history select own"
ON public.transfer_status_history FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transfers t
     WHERE t.id = transfer_status_history.transfer_id
       AND (t.sender_user_id = auth.uid() OR public.is_staff(auth.uid()))
  )
);

-- ---------- TRANSFER LIMITS (server-controlled configuration) ----------
CREATE TABLE public.transfer_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL UNIQUE,
  max_per_transfer_minor bigint NOT NULL CHECK (max_per_transfer_minor > 0),
  daily_limit_minor bigint NOT NULL CHECK (daily_limit_minor > 0),
  monthly_limit_minor bigint NOT NULL CHECK (monthly_limit_minor > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.transfer_limits TO authenticated;
GRANT ALL ON public.transfer_limits TO service_role;
ALTER TABLE public.transfer_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfer limits readable by customers"
ON public.transfer_limits FOR SELECT TO authenticated USING (true);

CREATE TRIGGER set_updated_at_transfer_limits BEFORE UPDATE ON public.transfer_limits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.transfer_limits (currency, max_per_transfer_minor, daily_limit_minor, monthly_limit_minor)
VALUES ('TTD', 5000000, 10000000, 100000000);

-- ---------- FINANCIAL IMMUTABILITY AFTER CONFIRMATION ----------
CREATE OR REPLACE FUNCTION public.protect_transfer_financials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status NOT IN ('DRAFT','READY_FOR_CONFIRMATION') THEN
    IF NEW.amount_minor <> OLD.amount_minor
       OR NEW.currency <> OLD.currency
       OR NEW.source_account_id <> OLD.source_account_id
       OR COALESCE(NEW.destination_account_id::text,'') <> COALESCE(OLD.destination_account_id::text,'')
       OR COALESCE(NEW.beneficiary_id::text,'') <> COALESCE(OLD.beneficiary_id::text,'')
       OR NEW.public_reference <> OLD.public_reference
       OR NEW.idempotency_key <> OLD.idempotency_key THEN
      RAISE EXCEPTION 'confirmed transfers are financially immutable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_transfer_financials() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER protect_transfer_financials BEFORE UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.protect_transfer_financials();

-- ---------- PUBLIC REFERENCES ----------
CREATE SEQUENCE public.beneficiary_reference_seq;
CREATE SEQUENCE public.transfer_reference_seq;

CREATE OR REPLACE FUNCTION public.next_beneficiary_public_reference()
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 'BEN-' || to_char(now(),'YYYY') || '-' ||
         lpad(nextval('public.beneficiary_reference_seq')::text, 6, '0');
$$;
REVOKE ALL ON FUNCTION public.next_beneficiary_public_reference() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.next_transfer_public_reference()
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 'TRF-' || to_char(now(),'YYYY') || '-' ||
         lpad(nextval('public.transfer_reference_seq')::text, 8, '0');
$$;
REVOKE ALL ON FUNCTION public.next_transfer_public_reference() FROM PUBLIC, anon, authenticated;

-- ---------- SAFE DISPLAY HELPERS ----------
CREATE OR REPLACE FUNCTION public.customer_safe_display_name(_user_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.profiles; _last text;
BEGIN
  SELECT * INTO _p FROM public.profiles WHERE id = _user_id;
  IF _p.id IS NULL THEN RETURN 'Titulaire du compte'; END IF;
  _last := CASE WHEN _p.last_name IS NULL OR _p.last_name = '' THEN '' ELSE upper(left(_p.last_name,1)) || '.' END;
  RETURN NULLIF(trim(COALESCE(_p.first_name,'') || ' ' || _last), '');
END;
$$;
REVOKE ALL ON FUNCTION public.customer_safe_display_name(uuid) FROM PUBLIC, anon, authenticated;

-- ---------- INTERNAL DESTINATION RESOLUTION ----------
-- Returns the minimum safe confirmation payload only (§12).
CREATE OR REPLACE FUNCTION public.resolve_internal_destination(_user_id uuid, _identifier text)
RETURNS TABLE (
  destination_account_id uuid,
  display_name text,
  masked_number text,
  currency text,
  is_own_account boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _acc public.bank_accounts; _needle text;
BEGIN
  _needle := upper(regexp_replace(COALESCE(_identifier,''), '\s', '', 'g'));
  IF length(_needle) < 6 THEN RETURN; END IF;

  SELECT * INTO _acc FROM public.bank_accounts
   WHERE status = 'ACTIVE'
     AND (upper(account_number) = _needle OR upper(COALESCE(iban,'')) = _needle
          OR upper(public_reference) = _needle)
   LIMIT 1;

  IF _acc.id IS NULL THEN RETURN; END IF;

  RETURN QUERY SELECT
    _acc.id,
    COALESCE(public.customer_safe_display_name(_acc.user_id), 'Titulaire du compte'),
    lpad(right(_acc.account_number, 4), 4, '0'),
    _acc.currency,
    _acc.user_id = _user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_internal_destination(uuid, text) FROM PUBLIC, anon, authenticated;

-- ---------- BENEFICIARY COMMANDS ----------
CREATE OR REPLACE FUNCTION public.create_internal_beneficiary(
  _user_id uuid, _identifier text, _nickname text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _r record; _existing public.beneficiaries; _id uuid; _lifecycle public.customer_lifecycle_state;
BEGIN
  SELECT lifecycle_state INTO _lifecycle FROM public.profiles WHERE id = _user_id;
  IF _lifecycle IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'ACCOUNT_RESTRICTED';
  END IF;

  SELECT * INTO _r FROM public.resolve_internal_destination(_user_id, _identifier);
  IF _r.destination_account_id IS NULL THEN
    RAISE EXCEPTION 'DESTINATION_UNAVAILABLE';
  END IF;

  SELECT * INTO _existing FROM public.beneficiaries
   WHERE user_id = _user_id AND destination_account_id = _r.destination_account_id
     AND status <> 'REMOVED';
  IF _existing.id IS NOT NULL THEN
    UPDATE public.beneficiaries
       SET nickname = COALESCE(NULLIF(trim(_nickname),''), nickname),
           status = 'ACTIVE'
     WHERE id = _existing.id;
    RETURN _existing.id;
  END IF;

  INSERT INTO public.beneficiaries (
    user_id, public_reference, beneficiary_type, display_name, nickname,
    destination_account_id, destination_account_masked, destination_currency
  ) VALUES (
    _user_id, public.next_beneficiary_public_reference(), 'INTERNAL_CUSTOMER',
    _r.display_name, NULLIF(trim(_nickname),''),
    _r.destination_account_id, _r.masked_number, _r.currency
  ) RETURNING id INTO _id;

  RETURN _id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_internal_beneficiary(uuid, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.remove_beneficiary(_user_id uuid, _reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.beneficiaries
     SET status = 'REMOVED'
   WHERE user_id = _user_id AND public_reference = _reference AND status <> 'REMOVED';
END;
$$;
REVOKE ALL ON FUNCTION public.remove_beneficiary(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rename_beneficiary(_user_id uuid, _reference text, _nickname text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.beneficiaries
     SET nickname = NULLIF(trim(_nickname),'')
   WHERE user_id = _user_id AND public_reference = _reference AND status = 'ACTIVE';
END;
$$;
REVOKE ALL ON FUNCTION public.rename_beneficiary(uuid, text, text) FROM PUBLIC, anon, authenticated;

-- ---------- TRANSFER COMMANDS ----------
CREATE OR REPLACE FUNCTION public.record_transfer_status(
  _transfer_id uuid, _from public.transfer_status, _to public.transfer_status,
  _reason text, _actor public.transfer_actor_type, _actor_ref uuid
)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.transfer_status_history
    (transfer_id, from_status, to_status, reason_code, actor_type, actor_reference)
  VALUES (_transfer_id, _from, _to, _reason, _actor, _actor_ref);
$$;
REVOKE ALL ON FUNCTION public.record_transfer_status(
  uuid, public.transfer_status, public.transfer_status, text, public.transfer_actor_type, uuid)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_internal_transfer(
  _user_id uuid,
  _source_account_reference text,
  _beneficiary_reference text,
  _amount_minor bigint,
  _customer_reference text DEFAULT NULL
)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _lifecycle public.customer_lifecycle_state;
  _src public.bank_accounts;
  _ben public.beneficiaries;
  _dst public.bank_accounts;
  _limits public.transfer_limits;
  _reference text;
  _transfer_id uuid;
BEGIN
  SELECT lifecycle_state INTO _lifecycle FROM public.profiles WHERE id = _user_id;
  IF _lifecycle IS DISTINCT FROM 'ACTIVE' THEN RAISE EXCEPTION 'ACCOUNT_RESTRICTED'; END IF;

  IF _amount_minor IS NULL OR _amount_minor <= 0 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;

  SELECT * INTO _src FROM public.bank_accounts
   WHERE public_reference = _source_account_reference AND user_id = _user_id;
  IF _src.id IS NULL THEN RAISE EXCEPTION 'SOURCE_ACCOUNT_UNAVAILABLE'; END IF;
  IF _src.status <> 'ACTIVE' THEN RAISE EXCEPTION 'ACCOUNT_RESTRICTED'; END IF;

  SELECT * INTO _ben FROM public.beneficiaries
   WHERE public_reference = _beneficiary_reference AND user_id = _user_id AND status = 'ACTIVE';
  IF _ben.id IS NULL THEN RAISE EXCEPTION 'BENEFICIARY_UNAVAILABLE'; END IF;

  SELECT * INTO _dst FROM public.bank_accounts WHERE id = _ben.destination_account_id;
  IF _dst.id IS NULL OR _dst.status <> 'ACTIVE' THEN RAISE EXCEPTION 'DESTINATION_UNAVAILABLE'; END IF;
  IF _dst.id = _src.id THEN RAISE EXCEPTION 'DESTINATION_UNAVAILABLE'; END IF;
  IF _dst.currency <> _src.currency THEN RAISE EXCEPTION 'CURRENCY_MISMATCH'; END IF;

  SELECT * INTO _limits FROM public.transfer_limits WHERE currency = _src.currency;
  IF _limits.id IS NOT NULL AND _amount_minor > _limits.max_per_transfer_minor THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED';
  END IF;

  _reference := public.next_transfer_public_reference();

  INSERT INTO public.transfers (
    public_reference, sender_user_id, source_account_id, beneficiary_id, destination_account_id,
    amount_minor, currency, customer_reference, status, idempotency_key,
    recipient_display_snapshot, destination_masked_snapshot, source_masked_snapshot
  ) VALUES (
    _reference, _user_id, _src.id, _ben.id, _dst.id,
    _amount_minor, _src.currency, NULLIF(left(trim(COALESCE(_customer_reference,'')), 140), ''),
    'READY_FOR_CONFIRMATION', 'transfer:' || _reference,
    _ben.display_name, _ben.destination_account_masked,
    lpad(right(_src.account_number, 4), 4, '0')
  ) RETURNING id INTO _transfer_id;

  PERFORM public.record_transfer_status(_transfer_id, NULL, 'DRAFT', 'CREATED', 'CUSTOMER', _user_id);
  PERFORM public.record_transfer_status(_transfer_id, 'DRAFT', 'READY_FOR_CONFIRMATION', 'READY', 'SYSTEM', NULL);

  RETURN _reference;
END;
$$;
REVOKE ALL ON FUNCTION public.create_internal_transfer(uuid, text, text, bigint, text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.confirm_internal_transfer(_user_id uuid, _reference text)
RETURNS TABLE (status public.transfer_status, failure_code text, transaction_reference text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _t public.transfers;
  _src public.bank_accounts;
  _dst public.bank_accounts;
  _ben public.beneficiaries;
  _lifecycle public.customer_lifecycle_state;
  _limits public.transfer_limits;
  _available bigint;
  _used_day bigint;
  _used_month bigint;
  _hold uuid;
  _src_ledger uuid;
  _dst_ledger uuid;
  _posting record;
  _txn_ref text;
  _fail text;
BEGIN
  SELECT * INTO _t FROM public.transfers
   WHERE public_reference = _reference AND sender_user_id = _user_id FOR UPDATE;
  IF _t.id IS NULL THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;

  -- Idempotent recovery (§74, §75, §114).
  IF _t.status = 'COMPLETED' THEN
    SELECT lt.public_reference INTO _txn_ref FROM public.ledger_transactions lt
     WHERE lt.id = _t.ledger_transaction_id;
    RETURN QUERY SELECT _t.status, _t.failure_code, _txn_ref;
    RETURN;
  END IF;

  IF _t.status NOT IN ('READY_FOR_CONFIRMATION','CONFIRMED','FUNDS_RESERVED','PROCESSING') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  END IF;

  SELECT lifecycle_state INTO _lifecycle FROM public.profiles WHERE id = _user_id;
  SELECT * INTO _src FROM public.bank_accounts WHERE id = _t.source_account_id FOR UPDATE;
  SELECT * INTO _dst FROM public.bank_accounts WHERE id = _t.destination_account_id;
  SELECT * INTO _ben FROM public.beneficiaries WHERE id = _t.beneficiary_id;
  SELECT * INTO _limits FROM public.transfer_limits WHERE currency = _t.currency;

  -- Re-validation at execution time (§126 – §128).
  IF _lifecycle IS DISTINCT FROM 'ACTIVE' OR _src.status <> 'ACTIVE' THEN
    _fail := 'ACCOUNT_RESTRICTED';
  ELSIF _dst.id IS NULL OR _dst.status <> 'ACTIVE' OR _ben.id IS NULL OR _ben.status <> 'ACTIVE' THEN
    _fail := 'DESTINATION_UNAVAILABLE';
  ELSIF _dst.currency <> _src.currency OR _t.currency <> _src.currency THEN
    _fail := 'CURRENCY_MISMATCH';
  ELSIF _limits.id IS NOT NULL AND _t.amount_minor > _limits.max_per_transfer_minor THEN
    _fail := 'LIMIT_EXCEEDED';
  END IF;

  IF _fail IS NULL AND _limits.id IS NOT NULL THEN
    SELECT COALESCE(SUM(amount_minor),0) INTO _used_day FROM public.transfers
     WHERE sender_user_id = _user_id AND status = 'COMPLETED'
       AND completed_at >= date_trunc('day', now());
    SELECT COALESCE(SUM(amount_minor),0) INTO _used_month FROM public.transfers
     WHERE sender_user_id = _user_id AND status = 'COMPLETED'
       AND completed_at >= date_trunc('month', now());
    IF _used_day + _t.amount_minor > _limits.daily_limit_minor
       OR _used_month + _t.amount_minor > _limits.monthly_limit_minor THEN
      _fail := 'LIMIT_EXCEEDED';
    END IF;
  END IF;

  IF _fail IS NULL THEN
    SELECT available_balance_minor INTO _available FROM public.account_balances
     WHERE account_id = _src.id;
    IF COALESCE(_available,0) < _t.amount_minor THEN
      _fail := 'INSUFFICIENT_FUNDS';
    END IF;
  END IF;

  IF _fail IS NOT NULL THEN
    UPDATE public.transfers
       SET status = 'FAILED', failure_code = _fail, failed_at = now(), processing_stage = NULL
     WHERE id = _t.id;
    PERFORM public.record_transfer_status(_t.id, _t.status, 'FAILED', _fail, 'SYSTEM', NULL);
    RETURN QUERY SELECT 'FAILED'::public.transfer_status, _fail, NULL::text;
    RETURN;
  END IF;

  IF _t.status = 'READY_FOR_CONFIRMATION' THEN
    UPDATE public.transfers SET status = 'CONFIRMED', confirmed_at = now() WHERE id = _t.id;
    PERFORM public.record_transfer_status(_t.id, _t.status, 'CONFIRMED', 'CUSTOMER_CONFIRMED', 'CUSTOMER', _user_id);
  END IF;

  -- Fund reservation (§57 – §63): idempotent through the hold key.
  _hold := _t.hold_id;
  IF _hold IS NULL THEN
    BEGIN
      _hold := public.create_account_hold(
        _src.id, _t.amount_minor, 'TRANSFER_PENDING', _t.public_reference,
        'transfer-hold:' || _t.id::text, NULL
      );
    EXCEPTION WHEN OTHERS THEN
      _hold := NULL;
    END;

    IF _hold IS NULL THEN
      UPDATE public.transfers
         SET status = 'FAILED', failure_code = 'INSUFFICIENT_FUNDS', failed_at = now()
       WHERE id = _t.id;
      PERFORM public.record_transfer_status(_t.id, 'CONFIRMED', 'FAILED', 'INSUFFICIENT_FUNDS', 'SYSTEM', NULL);
      RETURN QUERY SELECT 'FAILED'::public.transfer_status, 'INSUFFICIENT_FUNDS'::text, NULL::text;
      RETURN;
    END IF;

    UPDATE public.transfers
       SET status = 'FUNDS_RESERVED', hold_id = _hold WHERE id = _t.id;
    PERFORM public.record_transfer_status(_t.id, 'CONFIRMED', 'FUNDS_RESERVED', 'FUNDS_RESERVED', 'SYSTEM', NULL);
  END IF;

  UPDATE public.transfers
     SET status = 'PROCESSING', processing_started_at = COALESCE(processing_started_at, now()),
         processing_stage = 'LEDGER_POSTING'
   WHERE id = _t.id;
  PERFORM public.record_transfer_status(_t.id, 'FUNDS_RESERVED', 'PROCESSING', 'PROCESSING', 'SYSTEM', NULL);

  _src_ledger := public.ensure_bank_account_ledger_account(_src.id);
  _dst_ledger := public.ensure_bank_account_ledger_account(_dst.id);

  -- One balanced journal: sender liability debited, recipient liability credited.
  SELECT * INTO _posting FROM public.post_ledger_transaction(
    'TRANSFER',
    _t.currency,
    'Virement interne ' || _t.public_reference,
    'INTERNAL_TRANSFER',
    _t.public_reference,
    'transfer-posting:' || _t.id::text,
    jsonb_build_array(
      jsonb_build_object('ledgerAccountId', _src_ledger, 'side', 'DEBIT',
                         'amountMinor', _t.amount_minor,
                         'description', 'Virement vers ' || _t.recipient_display_snapshot),
      jsonb_build_object('ledgerAccountId', _dst_ledger, 'side', 'CREDIT',
                         'amountMinor', _t.amount_minor,
                         'description', 'Virement reçu de ' ||
                           COALESCE(public.customer_safe_display_name(_user_id), 'un client'))
    ),
    _user_id,
    jsonb_build_object('operationKind', 'INTERNAL_TRANSFER',
                       'counterpartyDisplay', _t.recipient_display_snapshot),
    NULL
  );

  IF _posting.id IS NULL THEN
    RAISE EXCEPTION 'PROCESSING_ERROR';
  END IF;

  PERFORM public.capture_account_hold(_hold);

  UPDATE public.transfers
     SET status = 'COMPLETED', completed_at = now(), processing_stage = NULL,
         ledger_transaction_id = _posting.id, failure_code = NULL
   WHERE id = _t.id;
  PERFORM public.record_transfer_status(_t.id, 'PROCESSING', 'COMPLETED', 'POSTED', 'SYSTEM', NULL);

  UPDATE public.beneficiaries SET last_used_at = now() WHERE id = _t.beneficiary_id;

  RETURN QUERY SELECT 'COMPLETED'::public.transfer_status, NULL::text, _posting.public_reference;
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_internal_transfer(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.cancel_transfer(_user_id uuid, _reference text)
RETURNS public.transfer_status LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t public.transfers;
BEGIN
  SELECT * INTO _t FROM public.transfers
   WHERE public_reference = _reference AND sender_user_id = _user_id FOR UPDATE;
  IF _t.id IS NULL THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;
  IF _t.status = 'CANCELLED' THEN RETURN _t.status; END IF;
  IF _t.status NOT IN ('DRAFT','READY_FOR_CONFIRMATION','CONFIRMED','FUNDS_RESERVED') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  END IF;

  IF _t.hold_id IS NOT NULL THEN
    PERFORM public.release_account_hold(_t.hold_id);
  END IF;

  UPDATE public.transfers SET status = 'CANCELLED', cancelled_at = now(), processing_stage = NULL
   WHERE id = _t.id;
  PERFORM public.record_transfer_status(_t.id, _t.status, 'CANCELLED', 'CUSTOMER_CANCELLED', 'CUSTOMER', _user_id);

  RETURN 'CANCELLED'::public.transfer_status;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_transfer(uuid, text) FROM PUBLIC, anon, authenticated;