ALTER TABLE public.transfers ADD COLUMN IF NOT EXISTS fee_minor bigint NOT NULL DEFAULT 0 CHECK (fee_minor >= 0);

CREATE OR REPLACE FUNCTION public.current_fee_minor(_key text)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT round(v.numeric_value)::bigint FROM public.financial_setting_versions v
    WHERE v.setting_key = _key AND v.effective_at <= now()
    ORDER BY v.effective_at DESC, v.version DESC LIMIT 1), 0)
$$;
REVOKE EXECUTE ON FUNCTION public.current_fee_minor(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.confirm_external_transfer(_user_id uuid, _reference text)
 RETURNS TABLE(status transfer_status, failure_code text, progress_percent smallint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  _fee bigint;
BEGIN
  SELECT * INTO _t FROM public.transfers tr
   WHERE tr.public_reference = _reference AND tr.sender_user_id = _user_id FOR UPDATE;
  IF _t.id IS NULL THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;
  IF _t.transfer_kind <> 'EXTERNAL_TRANSFER' THEN RAISE EXCEPTION 'INVALID_TRANSITION'; END IF;

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

  _fee := CASE WHEN _t.hold_id IS NULL THEN public.current_fee_minor('TRANSFER_EXTERNAL') ELSE _t.fee_minor END;
  IF _fail IS NULL THEN
    SELECT ab.available_balance_minor INTO _available FROM public.account_balances ab
     WHERE ab.account_id = _src.id;
    IF COALESCE(_available, 0) < _t.amount_minor + _fee THEN _fail := 'INSUFFICIENT_FUNDS'; END IF;
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

  UPDATE public.transfers SET security_confirmed_at = now(), confirmed_at = COALESCE(confirmed_at, now())
   WHERE transfers.id = _t.id;
  PERFORM public.set_transfer_progress(_t.id, 'SECURITY_CONFIRMED');
  PERFORM public.record_transfer_status(_t.id, _t.status, 'CONFIRMED', 'CUSTOMER_CONFIRMED', 'CUSTOMER', _user_id);

  _hold := _t.hold_id;
  IF _hold IS NULL THEN
    _hold := public.create_account_hold(
      _src.id, _t.amount_minor + _fee, 'EXTERNAL_TRANSFER_PENDING', _t.public_reference,
      'transfer-hold:' || _t.id::text, NULL
    );
    UPDATE public.transfers SET hold_id = _hold, fee_minor = _fee, status = 'FUNDS_RESERVED' WHERE transfers.id = _t.id;
    PERFORM public.record_transfer_status(_t.id, 'CONFIRMED', 'FUNDS_RESERVED', 'FUNDS_RESERVED', 'SYSTEM', NULL);
  END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.apply_external_settlement_result(_reference text, _provider_status external_settlement_status, _provider_reference text DEFAULT NULL::text)
 RETURNS TABLE(status transfer_status, progress_percent smallint, transaction_reference text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _t public.transfers;
  _src_ledger uuid;
  _clearing uuid;
  _posting record;
  _fee_acc uuid;
  _entries jsonb;
BEGIN
  SELECT * INTO _t FROM public.transfers WHERE public_reference = _reference FOR UPDATE;
  IF _t.id IS NULL OR _t.transfer_kind <> 'EXTERNAL_TRANSFER' THEN RAISE EXCEPTION 'TRANSFER_UNAVAILABLE'; END IF;

  IF _t.status = 'COMPLETED' THEN
    RETURN QUERY SELECT _t.status, _t.progress_percent,
      (SELECT lt.public_reference FROM public.ledger_transactions lt WHERE lt.id = _t.ledger_transaction_id);
    RETURN;
  END IF;

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

  _src_ledger := public.ensure_bank_account_ledger_account(_t.source_account_id);
  _clearing := public.ensure_settlement_clearing_account(_t.currency);

  _entries := jsonb_build_array(
      jsonb_build_object('ledgerAccountId', _src_ledger, 'side', 'DEBIT',
                         'amountMinor', _t.amount_minor,
                         'description', 'Virement externe vers ' || _t.recipient_display_snapshot),
      jsonb_build_object('ledgerAccountId', _clearing, 'side', 'CREDIT',
                         'amountMinor', _t.amount_minor,
                         'description', 'Compensation règlement externe'));
  IF COALESCE(_t.fee_minor, 0) > 0 THEN
    SELECT la.id INTO _fee_acc FROM public.ledger_accounts la WHERE la.code = 'FEE_REVENUE.' || _t.currency;
    IF _fee_acc IS NULL THEN RAISE EXCEPTION 'PROCESSING_ERROR'; END IF;
    _entries := _entries || jsonb_build_array(
      jsonb_build_object('ledgerAccountId', _src_ledger, 'side', 'DEBIT',
                         'amountMinor', _t.fee_minor, 'description', 'Frais de virement externe ' || _t.public_reference),
      jsonb_build_object('ledgerAccountId', _fee_acc, 'side', 'CREDIT',
                         'amountMinor', _t.fee_minor, 'description', 'Commission virement externe'));
  END IF;

  SELECT * INTO _posting FROM public.post_ledger_transaction(
    'TRANSFER', _t.currency, 'Virement externe ' || _t.public_reference,
    'EXTERNAL_TRANSFER', _t.public_reference, 'external-posting:' || _t.id::text,
    _entries, _t.sender_user_id,
    jsonb_build_object('operationKind', 'EXTERNAL_TRANSFER', 'feeMinor', COALESCE(_t.fee_minor,0)), NULL);

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
$function$;