-- ============================================================
-- PROMPT 08 — Transfer routing, compliance journey, external transfers
-- ============================================================

-- 1. Enums -----------------------------------------------------------------
CREATE TYPE public.transfer_kind AS ENUM ('INTERNAL_TRANSFER', 'EXTERNAL_TRANSFER');

CREATE TYPE public.transfer_progress_state AS ENUM (
  'CREATED','ACCOUNT_VALIDATED','FUNDS_VALIDATED','SECURITY_CONFIRMED',
  'COMPLIANCE_CHECK','DOCUMENT_REQUIRED','DOCUMENT_REVIEW','FINAL_REVIEW',
  'APPROVED','SETTLEMENT_PENDING','COMPLETED','FAILED','CANCELLED','BLOCKED'
);

CREATE TYPE public.transfer_requirement_type AS ENUM (
  'IDENTITY_DOCUMENT','SOURCE_OF_FUNDS','INVOICE','CONTRACT',
  'PROOF_OF_PAYMENT_PURPOSE','PROOF_OF_ADDRESS','OTHER_SUPPORTING_DOCUMENT'
);

CREATE TYPE public.transfer_requirement_status AS ENUM (
  'REQUIRED','SUBMITTED','UNDER_REVIEW','SATISFIED','REPLACEMENT_REQUIRED','WAIVED','EXPIRED'
);

CREATE TYPE public.transfer_document_status AS ENUM (
  'UPLOADED','UNDER_REVIEW','ACCEPTED','REJECTED','REPLACEMENT_REQUIRED'
);

CREATE TYPE public.transfer_compliance_status AS ENUM (
  'NOT_REQUIRED','OPEN','CUSTOMER_ACTION_REQUIRED','DOCUMENTS_RECEIVED',
  'UNDER_REVIEW','APPROVED','REJECTED','CLOSED'
);

CREATE TYPE public.external_settlement_status AS ENUM (
  'NOT_SUBMITTED','SUBMITTED','PENDING','SUCCEEDED','FAILED','CANCELLED','UNKNOWN'
);

ALTER TYPE public.transfer_status ADD VALUE IF NOT EXISTS 'SETTLEMENT_PENDING';
ALTER TYPE public.transfer_status ADD VALUE IF NOT EXISTS 'REJECTED';

-- 2. Supported external rails ---------------------------------------------
CREATE TABLE public.external_settlement_rails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  country text NOT NULL,
  currency text NOT NULL,
  provider_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_simulation boolean NOT NULL DEFAULT true,
  requires_compliance_review boolean NOT NULL DEFAULT true,
  document_threshold_minor bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.external_settlement_rails TO authenticated;
GRANT ALL ON public.external_settlement_rails TO service_role;
ALTER TABLE public.external_settlement_rails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read active rails"
  ON public.external_settlement_rails FOR SELECT TO authenticated
  USING (is_active);

CREATE TRIGGER set_updated_at_external_settlement_rails
  BEFORE UPDATE ON public.external_settlement_rails
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.external_settlement_rails
  (code, display_name, country, currency, provider_key, is_simulation,
   requires_compliance_review, document_threshold_minor)
VALUES
  ('TT_DOMESTIC', 'Banques locales (Trinité-et-Tobago)', 'TT', 'TTD', 'SIMULATED_DOMESTIC_RAIL',
   true, true, 500000);

-- 3. Beneficiaries: external destination details ---------------------------
ALTER TABLE public.beneficiaries
  ADD COLUMN external_bank_name text,
  ADD COLUMN external_country text,
  ADD COLUMN external_account_identifier text,
  ADD COLUMN external_routing_code text,
  ADD COLUMN settlement_rail_id uuid REFERENCES public.external_settlement_rails(id);

-- 4. Transfers: routing, progress and external workflow --------------------
ALTER TABLE public.transfers
  ADD COLUMN transfer_kind public.transfer_kind NOT NULL DEFAULT 'INTERNAL_TRANSFER',
  ADD COLUMN progress_state public.transfer_progress_state NOT NULL DEFAULT 'CREATED',
  ADD COLUMN progress_percent smallint NOT NULL DEFAULT 0
    CHECK (progress_percent BETWEEN 0 AND 100),
  ADD COLUMN current_requirement_id uuid,
  ADD COLUMN compliance_case_id uuid,
  ADD COLUMN settlement_rail_id uuid REFERENCES public.external_settlement_rails(id),
  ADD COLUMN external_provider_reference text,
  ADD COLUMN external_status public.external_settlement_status,
  ADD COLUMN validated_at timestamptz,
  ADD COLUMN security_confirmed_at timestamptz,
  ADD COLUMN documents_requested_at timestamptz,
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN settlement_submitted_at timestamptz,
  ADD COLUMN finalized_at timestamptz;

UPDATE public.transfers
   SET progress_state = 'COMPLETED', progress_percent = 100, finalized_at = completed_at
 WHERE status = 'COMPLETED';

-- 5. Compliance cases ------------------------------------------------------
CREATE TABLE public.transfer_compliance_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL UNIQUE REFERENCES public.transfers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.transfer_compliance_status NOT NULL DEFAULT 'OPEN',
  review_required boolean NOT NULL DEFAULT true,
  documents_required boolean NOT NULL DEFAULT false,
  risk_category text,
  internal_note text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  decision_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.transfer_compliance_cases TO authenticated;
GRANT ALL ON public.transfer_compliance_cases TO service_role;
ALTER TABLE public.transfer_compliance_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read their own compliance case"
  ON public.transfer_compliance_cases FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TRIGGER set_updated_at_transfer_compliance_cases
  BEFORE UPDATE ON public.transfer_compliance_cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.transfers
  ADD CONSTRAINT transfers_compliance_case_fkey
  FOREIGN KEY (compliance_case_id) REFERENCES public.transfer_compliance_cases(id);

-- 6. Requirements ----------------------------------------------------------
CREATE TABLE public.transfer_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requirement_type public.transfer_requirement_type NOT NULL,
  title text NOT NULL,
  description text,
  is_mandatory boolean NOT NULL DEFAULT true,
  status public.transfer_requirement_status NOT NULL DEFAULT 'REQUIRED',
  rejection_reason_code text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transfer_requirements_transfer_idx ON public.transfer_requirements(transfer_id);

GRANT SELECT ON public.transfer_requirements TO authenticated;
GRANT ALL ON public.transfer_requirements TO service_role;
ALTER TABLE public.transfer_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read their own transfer requirements"
  ON public.transfer_requirements FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TRIGGER set_updated_at_transfer_requirements
  BEFORE UPDATE ON public.transfer_requirements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.transfers
  ADD CONSTRAINT transfers_current_requirement_fkey
  FOREIGN KEY (current_requirement_id) REFERENCES public.transfer_requirements(id);

-- 7. Documents -------------------------------------------------------------
CREATE TABLE public.transfer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES public.transfer_requirements(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type public.transfer_requirement_type NOT NULL,
  storage_path text NOT NULL,
  original_filename text,
  mime_type text,
  size_bytes bigint,
  status public.transfer_document_status NOT NULL DEFAULT 'UPLOADED',
  rejection_reason_code text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transfer_documents_transfer_idx ON public.transfer_documents(transfer_id);

GRANT SELECT ON public.transfer_documents TO authenticated;
GRANT ALL ON public.transfer_documents TO service_role;
ALTER TABLE public.transfer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read their own transfer documents"
  ON public.transfer_documents FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TRIGGER set_updated_at_transfer_documents
  BEFORE UPDATE ON public.transfer_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Private storage policies ---------------------------------------------
CREATE POLICY "Customers read their own transfer documents in storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'transfer-documents'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid()))
  );

CREATE POLICY "Customers upload their own transfer documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'transfer-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Customers replace their own transfer documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'transfer-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'transfer-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 9. Progress mapper (single source of truth, §26) -------------------------
CREATE OR REPLACE FUNCTION public.transfer_progress_for_state(_state public.transfer_progress_state)
RETURNS smallint
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE _state
    WHEN 'CREATED' THEN 0
    WHEN 'ACCOUNT_VALIDATED' THEN 15
    WHEN 'FUNDS_VALIDATED' THEN 30
    WHEN 'SECURITY_CONFIRMED' THEN 45
    WHEN 'COMPLIANCE_CHECK' THEN 60
    WHEN 'DOCUMENT_REQUIRED' THEN 75
    WHEN 'DOCUMENT_REVIEW' THEN 80
    WHEN 'FINAL_REVIEW' THEN 90
    WHEN 'APPROVED' THEN 95
    WHEN 'SETTLEMENT_PENDING' THEN 99
    WHEN 'COMPLETED' THEN 100
    ELSE 0
  END::smallint;
$$;

CREATE OR REPLACE FUNCTION public.set_transfer_progress(
  _transfer_id uuid,
  _state public.transfer_progress_state,
  _freeze boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _current smallint;
BEGIN
  SELECT progress_percent INTO _current FROM public.transfers WHERE id = _transfer_id;

  UPDATE public.transfers
     SET progress_state = _state,
         progress_percent = CASE
           WHEN _freeze THEN COALESCE(_current, 0)
           ELSE public.transfer_progress_for_state(_state)
         END
   WHERE id = _transfer_id;
END;
$$;

-- 10. Settlement clearing ledger account -----------------------------------
CREATE OR REPLACE FUNCTION public.ensure_settlement_clearing_account(_currency text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _id uuid;
BEGIN
  SELECT id INTO _id FROM public.ledger_accounts
   WHERE code = 'SETTLEMENT_CLEARING.' || _currency;
  IF _id IS NOT NULL THEN RETURN _id; END IF;

  INSERT INTO public.ledger_accounts (code, name, account_class, normal_side, currency)
  VALUES ('SETTLEMENT_CLEARING.' || _currency,
          'Compte de compensation règlements externes ' || _currency,
          'LIABILITY', 'CREDIT', _currency)
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

-- 11. Server-authoritative destination routing (§17 – §20) -----------------
CREATE OR REPLACE FUNCTION public.classify_transfer_destination(_beneficiary_id uuid)
RETURNS TABLE(kind public.transfer_kind, rail_id uuid, supported boolean, reason text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _ben public.beneficiaries; _dst public.bank_accounts; _rail public.external_settlement_rails;
BEGIN
  SELECT * INTO _ben FROM public.beneficiaries WHERE id = _beneficiary_id;
  IF _ben.id IS NULL THEN
    RETURN QUERY SELECT 'EXTERNAL_TRANSFER'::public.transfer_kind, NULL::uuid, false, 'BENEFICIARY_UNAVAILABLE';
    RETURN;
  END IF;

  IF _ben.destination_account_id IS NOT NULL THEN
    SELECT * INTO _dst FROM public.bank_accounts WHERE id = _ben.destination_account_id;
    IF _dst.id IS NOT NULL AND _dst.status = 'ACTIVE' THEN
      RETURN QUERY SELECT 'INTERNAL_TRANSFER'::public.transfer_kind, NULL::uuid, true, NULL::text;
      RETURN;
    END IF;
    RETURN QUERY SELECT 'INTERNAL_TRANSFER'::public.transfer_kind, NULL::uuid, false, 'DESTINATION_UNAVAILABLE';
    RETURN;
  END IF;

  SELECT * INTO _rail FROM public.external_settlement_rails
   WHERE id = _ben.settlement_rail_id AND is_active;
  IF _rail.id IS NULL THEN
    RETURN QUERY SELECT 'EXTERNAL_TRANSFER'::public.transfer_kind, NULL::uuid, false, 'DESTINATION_NOT_SUPPORTED';
    RETURN;
  END IF;

  RETURN QUERY SELECT 'EXTERNAL_TRANSFER'::public.transfer_kind, _rail.id, true, NULL::text;
END;
$$;

-- 12. External beneficiary creation ----------------------------------------
CREATE OR REPLACE FUNCTION public.create_external_beneficiary(
  _user_id uuid,
  _display_name text,
  _bank_name text,
  _account_identifier text,
  _country text,
  _currency text,
  _routing_code text DEFAULT NULL,
  _nickname text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _lifecycle public.customer_lifecycle_state;
  _rail public.external_settlement_rails;
  _identifier text;
  _id uuid;
BEGIN
  SELECT lifecycle_state INTO _lifecycle FROM public.profiles WHERE id = _user_id;
  IF _lifecycle IS DISTINCT FROM 'ACTIVE' THEN RAISE EXCEPTION 'ACCOUNT_RESTRICTED'; END IF;

  _identifier := upper(regexp_replace(COALESCE(_account_identifier, ''), '\s', '', 'g'));
  IF length(_identifier) < 6 THEN RAISE EXCEPTION 'INVALID_DESTINATION'; END IF;
  IF NULLIF(trim(COALESCE(_display_name, '')), '') IS NULL
     OR NULLIF(trim(COALESCE(_bank_name, '')), '') IS NULL THEN
    RAISE EXCEPTION 'INVALID_DESTINATION';
  END IF;

  SELECT * INTO _rail FROM public.external_settlement_rails
   WHERE is_active AND currency = upper(_currency) AND country = upper(_country)
   ORDER BY created_at LIMIT 1;
  IF _rail.id IS NULL THEN RAISE EXCEPTION 'DESTINATION_NOT_SUPPORTED'; END IF;

  -- An internal account must never be registered as an external destination.
  IF EXISTS (
    SELECT 1 FROM public.bank_accounts
     WHERE upper(account_number) = _identifier OR upper(COALESCE(iban, '')) = _identifier
  ) THEN
    RAISE EXCEPTION 'DESTINATION_IS_INTERNAL';
  END IF;

  INSERT INTO public.beneficiaries (
    user_id, public_reference, beneficiary_type, display_name, nickname,
    destination_account_id, destination_account_masked, destination_currency,
    destination_bank_type, external_bank_name, external_country,
    external_account_identifier, external_routing_code, settlement_rail_id
  ) VALUES (
    _user_id, public.next_beneficiary_public_reference(), 'EXTERNAL_BANK',
    trim(_display_name), NULLIF(trim(_nickname), ''),
    NULL, lpad(right(_identifier, 4), 4, '0'), upper(_currency),
    'EXTERNAL', trim(_bank_name), upper(_country),
    _identifier, NULLIF(trim(COALESCE(_routing_code, '')), ''), _rail.id
  ) RETURNING id INTO _id;

  RETURN _id;
END;
$$;

-- 13. Unified transfer creation (server decides the route, §17, §107) ------
CREATE OR REPLACE FUNCTION public.create_customer_transfer(
  _user_id uuid,
  _source_account_reference text,
  _beneficiary_reference text,
  _amount_minor bigint,
  _customer_reference text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _lifecycle public.customer_lifecycle_state;
  _src public.bank_accounts;
  _ben public.beneficiaries;
  _route record;
  _limits public.transfer_limits;
  _reference text;
  _transfer_id uuid;
  _dst public.bank_accounts;
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

  SELECT * INTO _route FROM public.classify_transfer_destination(_ben.id);
  IF NOT _route.supported THEN RAISE EXCEPTION '%', _route.reason; END IF;
  IF _ben.destination_currency <> _src.currency THEN RAISE EXCEPTION 'CURRENCY_MISMATCH'; END IF;

  IF _route.kind = 'INTERNAL_TRANSFER' THEN
    SELECT * INTO _dst FROM public.bank_accounts WHERE id = _ben.destination_account_id;
    IF _dst.id = _src.id THEN RAISE EXCEPTION 'DESTINATION_UNAVAILABLE'; END IF;
  END IF;

  SELECT * INTO _limits FROM public.transfer_limits WHERE currency = _src.currency;
  IF _limits.id IS NOT NULL AND _amount_minor > _limits.max_per_transfer_minor THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED';
  END IF;

  _reference := public.next_transfer_public_reference();

  INSERT INTO public.transfers (
    public_reference, sender_user_id, source_account_id, beneficiary_id, destination_account_id,
    amount_minor, currency, customer_reference, status, idempotency_key,
    recipient_display_snapshot, destination_masked_snapshot, source_masked_snapshot,
    transfer_kind, settlement_rail_id, progress_state, progress_percent, external_status
  ) VALUES (
    _reference, _user_id, _src.id, _ben.id, _ben.destination_account_id,
    _amount_minor, _src.currency, NULLIF(left(trim(COALESCE(_customer_reference, '')), 140), ''),
    'READY_FOR_CONFIRMATION', 'transfer:' || _reference,
    _ben.display_name, _ben.destination_account_masked,
    lpad(right(_src.account_number, 4), 4, '0'),
    _route.kind, _route.rail_id, 'ACCOUNT_VALIDATED',
    public.transfer_progress_for_state('ACCOUNT_VALIDATED'),
    CASE WHEN _route.kind = 'EXTERNAL_TRANSFER' THEN 'NOT_SUBMITTED'::public.external_settlement_status END
  ) RETURNING id INTO _transfer_id;

  UPDATE public.transfers SET validated_at = now() WHERE id = _transfer_id;

  PERFORM public.record_transfer_status(_transfer_id, NULL, 'DRAFT', 'CREATED', 'CUSTOMER', _user_id);
  PERFORM public.record_transfer_status(_transfer_id, 'DRAFT', 'READY_FOR_CONFIRMATION', 'READY', 'SYSTEM', NULL);

  RETURN _reference;
END;
$$;

-- 14. External transfer confirmation (0 → 99, never 100 here) --------------
CREATE OR REPLACE FUNCTION public.confirm_external_transfer(_user_id uuid, _reference text)
RETURNS TABLE(status public.transfer_status, failure_code text, progress_percent smallint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _t public.transfers;
  _src public.bank_accounts;
  _ben public.beneficiaries;
  _rail public.external_settlement_rails;
  _limits public.transfer_limits;
  _lifecycle public.customer_lifecycle_state;
  _available bigint;
  _used_day bigint;
  _used_month bigint;
  _hold uuid;
  _case_id uuid;
  _req_id uuid;
  _fail text;
  _needs_document boolean;
BEGIN
  SELECT * INTO _t FROM public.transfers tr
   WHERE tr.public_reference = _reference AND tr.sender_user_id = _user_id FOR UPDATE;
  IF _t.id IS NULL THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;
  IF _t.transfer_kind <> 'EXTERNAL_TRANSFER' THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;

  -- Idempotent recovery: already advanced past confirmation.
  IF _t.status IN ('COMPLIANCE_REVIEW','DOCUMENT_REQUIRED','APPROVED','SETTLEMENT_PENDING',
                   'COMPLETED','FAILED','CANCELLED','BLOCKED','REJECTED') THEN
    RETURN QUERY SELECT _t.status, _t.failure_code, _t.progress_percent;
    RETURN;
  END IF;
  IF _t.status NOT IN ('READY_FOR_CONFIRMATION','CONFIRMED','FUNDS_RESERVED','PROCESSING') THEN
    RAISE EXCEPTION 'INVALID_TRANSITION';
  END IF;

  SELECT p.lifecycle_state INTO _lifecycle FROM public.profiles p WHERE p.id = _user_id;
  SELECT * INTO _src FROM public.bank_accounts a WHERE a.id = _t.source_account_id FOR UPDATE;
  SELECT * INTO _ben FROM public.beneficiaries b WHERE b.id = _t.beneficiary_id;
  SELECT * INTO _rail FROM public.external_settlement_rails r WHERE r.id = _t.settlement_rail_id AND r.is_active;
  SELECT * INTO _limits FROM public.transfer_limits l WHERE l.currency = _t.currency;

  IF _lifecycle IS DISTINCT FROM 'ACTIVE' OR _src.status <> 'ACTIVE' THEN
    _fail := 'ACCOUNT_RESTRICTED';
  ELSIF _ben.id IS NULL OR _ben.status <> 'ACTIVE' THEN
    _fail := 'BENEFICIARY_UNAVAILABLE';
  ELSIF _rail.id IS NULL THEN
    _fail := 'DESTINATION_NOT_SUPPORTED';
  ELSIF _ben.destination_currency <> _src.currency THEN
    _fail := 'CURRENCY_MISMATCH';
  ELSIF _limits.id IS NOT NULL AND _t.amount_minor > _limits.max_per_transfer_minor THEN
    _fail := 'LIMIT_EXCEEDED';
  END IF;

  IF _fail IS NULL AND _limits.id IS NOT NULL THEN
    SELECT COALESCE(SUM(tr.amount_minor),0) INTO _used_day FROM public.transfers tr
     WHERE tr.sender_user_id = _user_id AND tr.status = 'COMPLETED'
       AND tr.completed_at >= date_trunc('day', now());
    SELECT COALESCE(SUM(tr.amount_minor),0) INTO _used_month FROM public.transfers tr
     WHERE tr.sender_user_id = _user_id AND tr.status = 'COMPLETED'
       AND tr.completed_at >= date_trunc('month', now());
    IF _used_day + _t.amount_minor > _limits.daily_limit_minor
       OR _used_month + _t.amount_minor > _limits.monthly_limit_minor THEN
      _fail := 'LIMIT_EXCEEDED';
    END IF;
  END IF;

  IF _fail IS NULL THEN
    SELECT ab.available_balance_minor INTO _available FROM public.account_balances ab
     WHERE ab.account_id = _src.id;
    IF COALESCE(_available, 0) < _t.amount_minor THEN _fail := 'INSUFFICIENT_FUNDS'; END IF;
  END IF;

  IF _fail IS NOT NULL THEN
    UPDATE public.transfers
       SET status = 'FAILED', failure_code = _fail, failed_at = now(),
           progress_state = 'FAILED', processing_stage = NULL
     WHERE transfers.id = _t.id;
    PERFORM public.record_transfer_status(_t.id, _t.status, 'FAILED', _fail, 'SYSTEM', NULL);
    RETURN QUERY SELECT 'FAILED'::public.transfer_status, _fail, _t.progress_percent;
    RETURN;
  END IF;

  -- Funds validated → security confirmed.
  UPDATE public.transfers SET security_confirmed_at = now(), confirmed_at = COALESCE(confirmed_at, now())
   WHERE transfers.id = _t.id;
  PERFORM public.set_transfer_progress(_t.id, 'SECURITY_CONFIRMED');
  PERFORM public.record_transfer_status(_t.id, _t.status, 'CONFIRMED', 'CUSTOMER_CONFIRMED', 'CUSTOMER', _user_id);

  -- Reserve the funds: booked balance untouched, available balance reduced (§43, §44).
  _hold := _t.hold_id;
  IF _hold IS NULL THEN
    _hold := public.create_account_hold(
      _src.id, _t.amount_minor, 'EXTERNAL_TRANSFER_PENDING', _t.public_reference,
      'transfer-hold:' || _t.id::text, NULL
    );
    UPDATE public.transfers SET hold_id = _hold, status = 'FUNDS_RESERVED' WHERE transfers.id = _t.id;
    PERFORM public.record_transfer_status(_t.id, 'CONFIRMED', 'FUNDS_RESERVED', 'FUNDS_RESERVED', 'SYSTEM', NULL);
  END IF;

  -- Compliance pre-check (§42): only when the configured rail requires it.
  _needs_document := _rail.document_threshold_minor > 0
                     AND _t.amount_minor >= _rail.document_threshold_minor;

  INSERT INTO public.transfer_compliance_cases (transfer_id, user_id, status, review_required, documents_required)
  VALUES (_t.id, _user_id,
          CASE WHEN _needs_document THEN 'CUSTOMER_ACTION_REQUIRED'::public.transfer_compliance_status
               WHEN _rail.requires_compliance_review THEN 'UNDER_REVIEW'::public.transfer_compliance_status
               ELSE 'NOT_REQUIRED'::public.transfer_compliance_status END,
          _rail.requires_compliance_review, _needs_document)
  ON CONFLICT (transfer_id) DO UPDATE SET status = EXCLUDED.status
  RETURNING id INTO _case_id;

  UPDATE public.transfers SET compliance_case_id = _case_id WHERE transfers.id = _t.id;
  PERFORM public.set_transfer_progress(_t.id, 'COMPLIANCE_CHECK');

  IF _needs_document THEN
    INSERT INTO public.transfer_requirements
      (transfer_id, user_id, requirement_type, title, description)
    VALUES (_t.id, _user_id, 'SOURCE_OF_FUNDS',
            'Justificatif d''origine des fonds',
            'Pour finaliser ce virement vers une autre banque, transmettez un document justifiant l''origine des fonds (bulletin de salaire, acte de vente, relevé bancaire).')
    RETURNING id INTO _req_id;

    UPDATE public.transfers
       SET status = 'DOCUMENT_REQUIRED', current_requirement_id = _req_id, documents_requested_at = now()
     WHERE transfers.id = _t.id;
    PERFORM public.set_transfer_progress(_t.id, 'DOCUMENT_REQUIRED');
    PERFORM public.record_transfer_status(_t.id, 'FUNDS_RESERVED', 'DOCUMENT_REQUIRED', 'DOCUMENT_REQUESTED', 'COMPLIANCE', NULL);
  ELSIF _rail.requires_compliance_review THEN
    UPDATE public.transfers SET status = 'COMPLIANCE_REVIEW' WHERE transfers.id = _t.id;
    PERFORM public.set_transfer_progress(_t.id, 'FINAL_REVIEW');
    PERFORM public.record_transfer_status(_t.id, 'FUNDS_RESERVED', 'COMPLIANCE_REVIEW', 'REVIEW_REQUIRED', 'COMPLIANCE', NULL);
  ELSE
    UPDATE public.transfers SET status = 'APPROVED', approved_at = now() WHERE transfers.id = _t.id;
    PERFORM public.set_transfer_progress(_t.id, 'APPROVED');
    PERFORM public.record_transfer_status(_t.id, 'FUNDS_RESERVED', 'APPROVED', 'AUTO_APPROVED', 'SYSTEM', NULL);
  END IF;

  SELECT tr.status, tr.failure_code, tr.progress_percent INTO status, failure_code, progress_percent
    FROM public.transfers tr WHERE tr.id = _t.id;
  RETURN NEXT;
END;
$$;

-- 15. Unified confirmation entry point -------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_customer_transfer(_user_id uuid, _reference text)
RETURNS TABLE(status public.transfer_status, failure_code text, transaction_reference text, progress_percent smallint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _kind public.transfer_kind; _r record;
BEGIN
  SELECT tr.transfer_kind INTO _kind FROM public.transfers tr
   WHERE tr.public_reference = _reference AND tr.sender_user_id = _user_id;
  IF _kind IS NULL THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;

  IF _kind = 'INTERNAL_TRANSFER' THEN
    SELECT * INTO _r FROM public.confirm_internal_transfer(_user_id, _reference);
    UPDATE public.transfers tr
       SET progress_state = CASE WHEN _r.status = 'COMPLETED' THEN 'COMPLETED'::public.transfer_progress_state
                                 WHEN _r.status = 'FAILED' THEN 'FAILED'::public.transfer_progress_state
                                 ELSE tr.progress_state END,
           progress_percent = CASE WHEN _r.status = 'COMPLETED' THEN 100 ELSE tr.progress_percent END,
           finalized_at = CASE WHEN _r.status = 'COMPLETED' THEN now() ELSE tr.finalized_at END
     WHERE tr.public_reference = _reference;

    RETURN QUERY
      SELECT _r.status, _r.failure_code, _r.transaction_reference, tr.progress_percent
        FROM public.transfers tr WHERE tr.public_reference = _reference;
    RETURN;
  END IF;

  SELECT * INTO _r FROM public.confirm_external_transfer(_user_id, _reference);
  RETURN QUERY SELECT _r.status, _r.failure_code, NULL::text, _r.progress_percent;
END;
$$;

-- 16. Customer document submission (§35) -----------------------------------
CREATE OR REPLACE FUNCTION public.submit_transfer_document(
  _user_id uuid,
  _reference text,
  _requirement_id uuid,
  _storage_path text,
  _original_filename text DEFAULT NULL,
  _mime_type text DEFAULT NULL,
  _size_bytes bigint DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _t public.transfers; _req public.transfer_requirements; _doc_id uuid;
BEGIN
  SELECT * INTO _t FROM public.transfers
   WHERE public_reference = _reference AND sender_user_id = _user_id FOR UPDATE;
  IF _t.id IS NULL THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;

  SELECT * INTO _req FROM public.transfer_requirements
   WHERE id = _requirement_id AND transfer_id = _t.id AND user_id = _user_id FOR UPDATE;
  IF _req.id IS NULL THEN RAISE EXCEPTION 'REQUIREMENT_UNAVAILABLE'; END IF;
  IF _req.status NOT IN ('REQUIRED','REPLACEMENT_REQUIRED') THEN RAISE EXCEPTION 'REQUIREMENT_NOT_OPEN'; END IF;

  -- Documents must live under the owner's private folder.
  IF position((_user_id::text || '/') in _storage_path) <> 1 THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT_PATH';
  END IF;

  INSERT INTO public.transfer_documents
    (transfer_id, requirement_id, user_id, document_type, storage_path,
     original_filename, mime_type, size_bytes, status)
  VALUES (_t.id, _req.id, _user_id, _req.requirement_type, _storage_path,
          _original_filename, _mime_type, _size_bytes, 'UPLOADED')
  RETURNING id INTO _doc_id;

  UPDATE public.transfer_requirements
     SET status = 'UNDER_REVIEW', submitted_at = now(), rejection_reason_code = NULL
   WHERE id = _req.id;

  IF NOT EXISTS (
    SELECT 1 FROM public.transfer_requirements
     WHERE transfer_id = _t.id AND is_mandatory
       AND status IN ('REQUIRED','REPLACEMENT_REQUIRED')
  ) THEN
    UPDATE public.transfer_compliance_cases
       SET status = 'DOCUMENTS_RECEIVED' WHERE transfer_id = _t.id;
    UPDATE public.transfers
       SET status = 'COMPLIANCE_REVIEW', current_requirement_id = NULL
     WHERE id = _t.id;
    PERFORM public.set_transfer_progress(_t.id, 'DOCUMENT_REVIEW');
    PERFORM public.record_transfer_status(_t.id, 'DOCUMENT_REQUIRED', 'COMPLIANCE_REVIEW',
                                          'DOCUMENTS_RECEIVED', 'CUSTOMER', _user_id);
  END IF;

  RETURN _doc_id;
END;
$$;

-- 17. Staff review + settlement lifecycle (admin UI arrives in PROMPT 12/13)
CREATE OR REPLACE FUNCTION public.review_transfer_document(
  _staff_id uuid,
  _document_id uuid,
  _accept boolean,
  _reason_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _doc public.transfer_documents; _t public.transfers;
BEGIN
  IF NOT public.is_staff(_staff_id) THEN RAISE EXCEPTION 'NOT_AUTHORISED'; END IF;

  SELECT * INTO _doc FROM public.transfer_documents WHERE id = _document_id FOR UPDATE;
  IF _doc.id IS NULL THEN RAISE EXCEPTION 'DOCUMENT_UNAVAILABLE'; END IF;
  SELECT * INTO _t FROM public.transfers WHERE id = _doc.transfer_id FOR UPDATE;

  UPDATE public.transfer_documents
     SET status = CASE WHEN _accept THEN 'ACCEPTED'::public.transfer_document_status
                       ELSE 'REJECTED'::public.transfer_document_status END,
         rejection_reason_code = CASE WHEN _accept THEN NULL ELSE _reason_code END,
         reviewed_at = now()
   WHERE id = _document_id;

  UPDATE public.transfer_requirements
     SET status = CASE WHEN _accept THEN 'SATISFIED'::public.transfer_requirement_status
                       ELSE 'REPLACEMENT_REQUIRED'::public.transfer_requirement_status END,
         rejection_reason_code = CASE WHEN _accept THEN NULL ELSE _reason_code END,
         reviewed_at = now()
   WHERE id = _doc.requirement_id;

  IF _accept THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.transfer_requirements
       WHERE transfer_id = _t.id AND is_mandatory AND status <> 'SATISFIED'
    ) THEN
      UPDATE public.transfers SET status = 'COMPLIANCE_REVIEW' WHERE id = _t.id;
      PERFORM public.set_transfer_progress(_t.id, 'FINAL_REVIEW');
    END IF;
  ELSE
    UPDATE public.transfers
       SET status = 'DOCUMENT_REQUIRED', current_requirement_id = _doc.requirement_id
     WHERE id = _t.id;
    UPDATE public.transfer_compliance_cases
       SET status = 'CUSTOMER_ACTION_REQUIRED' WHERE transfer_id = _t.id;
    PERFORM public.set_transfer_progress(_t.id, 'DOCUMENT_REQUIRED');
    PERFORM public.record_transfer_status(_t.id, 'COMPLIANCE_REVIEW', 'DOCUMENT_REQUIRED',
                                          'DOCUMENT_REJECTED', 'COMPLIANCE', _staff_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_transfer_compliance(
  _staff_id uuid,
  _reference text,
  _decision text,
  _reason_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _t public.transfers;
BEGIN
  IF NOT public.is_staff(_staff_id) THEN RAISE EXCEPTION 'NOT_AUTHORISED'; END IF;

  SELECT * INTO _t FROM public.transfers WHERE public_reference = _reference FOR UPDATE;
  IF _t.id IS NULL THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;

  IF _decision = 'APPROVE' THEN
    UPDATE public.transfers SET status = 'APPROVED', approved_at = now() WHERE id = _t.id;
    UPDATE public.transfer_compliance_cases
       SET status = 'APPROVED', reviewed_at = now(), decision_at = now() WHERE transfer_id = _t.id;
    PERFORM public.set_transfer_progress(_t.id, 'APPROVED');
    PERFORM public.record_transfer_status(_t.id, _t.status, 'APPROVED', 'COMPLIANCE_APPROVED', 'COMPLIANCE', _staff_id);

  ELSIF _decision = 'REJECT' THEN
    IF _t.hold_id IS NOT NULL THEN PERFORM public.release_account_hold(_t.hold_id); END IF;
    UPDATE public.transfers
       SET status = 'REJECTED', failure_code = COALESCE(_reason_code, 'COMPLIANCE_REJECTED'),
           failed_at = now(), progress_state = 'FAILED', finalized_at = now()
     WHERE id = _t.id;
    UPDATE public.transfer_compliance_cases
       SET status = 'REJECTED', reviewed_at = now(), decision_at = now() WHERE transfer_id = _t.id;
    PERFORM public.record_transfer_status(_t.id, _t.status, 'REJECTED', 'COMPLIANCE_REJECTED', 'COMPLIANCE', _staff_id);

  ELSIF _decision = 'BLOCK' THEN
    -- Blocked keeps the hold and freezes progress: BLOCKED is not FAILED (§69, §70).
    UPDATE public.transfers SET status = 'BLOCKED' WHERE id = _t.id;
    PERFORM public.set_transfer_progress(_t.id, 'BLOCKED', true);
    PERFORM public.record_transfer_status(_t.id, _t.status, 'BLOCKED', COALESCE(_reason_code, 'BLOCKED'), 'COMPLIANCE', _staff_id);

  ELSE
    RAISE EXCEPTION 'INVALID_DECISION';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_external_settlement(_reference text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _t public.transfers;
BEGIN
  SELECT * INTO _t FROM public.transfers WHERE public_reference = _reference FOR UPDATE;
  IF _t.id IS NULL OR _t.transfer_kind <> 'EXTERNAL_TRANSFER' THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;
  IF _t.status = 'SETTLEMENT_PENDING' THEN RETURN; END IF;
  IF _t.status <> 'APPROVED' THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;

  UPDATE public.transfers
     SET status = 'SETTLEMENT_PENDING', external_status = 'SUBMITTED',
         settlement_submitted_at = now(),
         external_provider_reference = COALESCE(external_provider_reference,
                                                'SETL-' || replace(_t.id::text, '-', ''))
   WHERE id = _t.id;
  PERFORM public.set_transfer_progress(_t.id, 'SETTLEMENT_PENDING');
  PERFORM public.record_transfer_status(_t.id, 'APPROVED', 'SETTLEMENT_PENDING', 'SETTLEMENT_SUBMITTED', 'SYSTEM', NULL);
END;
$$;

-- Authoritative external settlement outcome: the only path to 100% (§56).
CREATE OR REPLACE FUNCTION public.apply_external_settlement_result(
  _reference text,
  _provider_status public.external_settlement_status,
  _provider_reference text DEFAULT NULL
)
RETURNS TABLE(status public.transfer_status, progress_percent smallint, transaction_reference text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _t public.transfers;
  _src_ledger uuid;
  _clearing uuid;
  _posting record;
BEGIN
  SELECT * INTO _t FROM public.transfers WHERE public_reference = _reference FOR UPDATE;
  IF _t.id IS NULL OR _t.transfer_kind <> 'EXTERNAL_TRANSFER' THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;

  IF _t.status = 'COMPLETED' THEN
    RETURN QUERY SELECT _t.status, _t.progress_percent,
      (SELECT lt.public_reference FROM public.ledger_transactions lt WHERE lt.id = _t.ledger_transaction_id);
    RETURN;
  END IF;

  -- Unknown / still pending: never auto-complete, never auto-fail (§73, §106).
  IF _provider_status IN ('PENDING','SUBMITTED','UNKNOWN') THEN
    UPDATE public.transfers SET external_status = _provider_status WHERE id = _t.id;
    RETURN QUERY SELECT _t.status, _t.progress_percent, NULL::text;
    RETURN;
  END IF;

  IF _provider_status IN ('FAILED','CANCELLED') THEN
    IF _t.hold_id IS NOT NULL THEN PERFORM public.release_account_hold(_t.hold_id); END IF;
    UPDATE public.transfers
       SET status = 'FAILED', external_status = _provider_status,
           failure_code = 'SETTLEMENT_FAILED', failed_at = now(),
           progress_state = 'FAILED', finalized_at = now(),
           external_provider_reference = COALESCE(_provider_reference, external_provider_reference)
     WHERE id = _t.id;
    PERFORM public.record_transfer_status(_t.id, _t.status, 'FAILED', 'SETTLEMENT_FAILED', 'SYSTEM', NULL);
    RETURN QUERY SELECT 'FAILED'::public.transfer_status, _t.progress_percent, NULL::text;
    RETURN;
  END IF;

  -- SUCCEEDED: balanced journal against the clearing account (§57 – §59).
  _src_ledger := public.ensure_bank_account_ledger_account(_t.source_account_id);
  _clearing := public.ensure_settlement_clearing_account(_t.currency);

  SELECT * INTO _posting FROM public.post_ledger_transaction(
    'TRANSFER',
    _t.currency,
    'Virement externe ' || _t.public_reference,
    'EXTERNAL_TRANSFER',
    _t.public_reference,
    'external-posting:' || _t.id::text,
    jsonb_build_array(
      jsonb_build_object('ledgerAccountId', _src_ledger, 'side', 'DEBIT',
                         'amountMinor', _t.amount_minor,
                         'description', 'Virement externe vers ' || _t.recipient_display_snapshot),
      jsonb_build_object('ledgerAccountId', _clearing, 'side', 'CREDIT',
                         'amountMinor', _t.amount_minor,
                         'description', 'Compensation règlement externe')
    ),
    _t.sender_user_id,
    jsonb_build_object('operationKind', 'EXTERNAL_TRANSFER'),
    NULL
  );

  IF _posting.id IS NULL THEN RAISE EXCEPTION 'PROCESSING_ERROR'; END IF;

  IF _t.hold_id IS NOT NULL THEN PERFORM public.capture_account_hold(_t.hold_id); END IF;

  UPDATE public.transfers
     SET status = 'COMPLETED', external_status = 'SUCCEEDED',
         completed_at = now(), finalized_at = now(),
         progress_state = 'COMPLETED', progress_percent = 100,
         ledger_transaction_id = _posting.id, failure_code = NULL,
         external_provider_reference = COALESCE(_provider_reference, external_provider_reference)
   WHERE id = _t.id;
  UPDATE public.transfer_compliance_cases SET status = 'CLOSED' WHERE transfer_id = _t.id;
  PERFORM public.record_transfer_status(_t.id, 'SETTLEMENT_PENDING', 'COMPLETED', 'SETTLED', 'SYSTEM', NULL);
  UPDATE public.beneficiaries SET last_used_at = now() WHERE id = _t.beneficiary_id;

  RETURN QUERY SELECT 'COMPLETED'::public.transfer_status, 100::smallint, _posting.public_reference;
END;
$$;

-- 18. Least privilege: financial routines are server-only ------------------
REVOKE EXECUTE ON FUNCTION public.set_transfer_progress(uuid, public.transfer_progress_state, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_settlement_clearing_account(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.classify_transfer_destination(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_external_beneficiary(uuid, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_customer_transfer(uuid, text, text, bigint, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_external_transfer(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_customer_transfer(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_transfer_document(uuid, text, uuid, text, text, text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.review_transfer_document(uuid, uuid, boolean, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decide_transfer_compliance(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_external_settlement(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_external_settlement_result(text, public.external_settlement_status, text) FROM PUBLIC, anon, authenticated;