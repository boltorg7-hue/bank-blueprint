-- 5.9.9.9 — harden settlement terminal-state handling and document retries

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
  SELECT * INTO _t
    FROM public.transfers
   WHERE public_reference = _reference
   FOR UPDATE;

  IF _t.id IS NULL OR _t.transfer_kind <> 'EXTERNAL_TRANSFER' THEN
    RAISE EXCEPTION 'TRANSFER_UNAVAILABLE';
  END IF;

  -- Terminal states are immutable from the settlement callback path.
  IF _t.status = 'COMPLETED' THEN
    RETURN QUERY
      SELECT _t.status, _t.progress_percent,
        (SELECT lt.public_reference
           FROM public.ledger_transactions lt
          WHERE lt.id = _t.ledger_transaction_id);
    RETURN;
  END IF;

  IF _t.status IN ('FAILED','CANCELLED','REJECTED','BLOCKED') THEN
    RAISE EXCEPTION 'SETTLEMENT_ALREADY_FINALIZED';
  END IF;

  IF _t.status <> 'SETTLEMENT_PENDING' THEN
    RAISE EXCEPTION 'INVALID_SETTLEMENT_STATE';
  END IF;

  IF _provider_status IN ('PENDING','SUBMITTED','UNKNOWN') THEN
    UPDATE public.transfers
       SET external_status = _provider_status,
           external_provider_reference = COALESCE(_provider_reference, external_provider_reference)
     WHERE id = _t.id;
    RETURN QUERY SELECT _t.status, _t.progress_percent, NULL::text;
    RETURN;
  END IF;

  IF _provider_status IN ('FAILED','CANCELLED') THEN
    IF _t.hold_id IS NOT NULL THEN
      PERFORM public.release_account_hold(_t.hold_id);
    END IF;

    UPDATE public.transfers
       SET status = 'FAILED',
           external_status = _provider_status,
           failure_code = 'SETTLEMENT_FAILED',
           failed_at = now(),
           progress_state = 'FAILED',
           finalized_at = now(),
           external_provider_reference = COALESCE(_provider_reference, external_provider_reference)
     WHERE id = _t.id;

    PERFORM public.record_transfer_status(
      _t.id, 'SETTLEMENT_PENDING', 'FAILED',
      'SETTLEMENT_FAILED', 'SYSTEM', NULL
    );

    RETURN QUERY SELECT 'FAILED'::public.transfer_status, _t.progress_percent, NULL::text;
    RETURN;
  END IF;

  -- SUCCEEDED: the only path to 100%, protected by the transfer row lock
  -- and the SETTLEMENT_PENDING state check above.
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

  IF _posting.id IS NULL THEN
    RAISE EXCEPTION 'PROCESSING_ERROR';
  END IF;

  IF _t.hold_id IS NOT NULL THEN
    PERFORM public.capture_account_hold(_t.hold_id);
  END IF;

  UPDATE public.transfers
     SET status = 'COMPLETED',
         external_status = 'SUCCEEDED',
         completed_at = now(),
         finalized_at = now(),
         progress_state = 'COMPLETED',
         progress_percent = 100,
         ledger_transaction_id = _posting.id,
         failure_code = NULL,
         external_provider_reference = COALESCE(_provider_reference, external_provider_reference)
   WHERE id = _t.id;

  UPDATE public.transfer_compliance_cases
     SET status = 'CLOSED'
   WHERE transfer_id = _t.id;

  PERFORM public.record_transfer_status(
    _t.id, 'SETTLEMENT_PENDING', 'COMPLETED',
    'SETTLED', 'SYSTEM', NULL
  );

  UPDATE public.beneficiaries
     SET last_used_at = now()
   WHERE id = _t.beneficiary_id;

  RETURN QUERY SELECT 'COMPLETED'::public.transfer_status, 100::smallint, _posting.public_reference;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_external_settlement_result(
  text, public.external_settlement_status, text
) FROM PUBLIC, anon, authenticated;

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
DECLARE
  _t public.transfers;
  _req public.transfer_requirements;
  _doc_id uuid;
BEGIN
  SELECT * INTO _t
    FROM public.transfers
   WHERE public_reference = _reference
     AND sender_user_id = _user_id
   FOR UPDATE;

  IF _t.id IS NULL THEN
    RAISE EXCEPTION 'TRANSFER_UNAVAILABLE';
  END IF;

  SELECT * INTO _req
    FROM public.transfer_requirements
   WHERE id = _requirement_id
     AND transfer_id = _t.id
     AND user_id = _user_id
   FOR UPDATE;

  IF _req.id IS NULL THEN
    RAISE EXCEPTION 'REQUIREMENT_UNAVAILABLE';
  END IF;

  -- A retry after a successful upload is idempotent: return the existing
  -- submission instead of inserting a second document.
  IF _req.status = 'UNDER_REVIEW' THEN
    SELECT id INTO _doc_id
      FROM public.transfer_documents
     WHERE requirement_id = _req.id
       AND user_id = _user_id
     ORDER BY created_at DESC, id DESC
     LIMIT 1;
    IF _doc_id IS NOT NULL THEN
      RETURN _doc_id;
    END IF;
  END IF;

  IF _req.status NOT IN ('REQUIRED','REPLACEMENT_REQUIRED') THEN
    RAISE EXCEPTION 'REQUIREMENT_NOT_OPEN';
  END IF;

  IF position((_user_id::text || '/') in _storage_path) <> 1 THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT_PATH';
  END IF;

  INSERT INTO public.transfer_documents
    (transfer_id, requirement_id, user_id, document_type, storage_path,
     original_filename, mime_type, size_bytes, status)
  VALUES
    (_t.id, _req.id, _user_id, _req.requirement_type, _storage_path,
     _original_filename, _mime_type, _size_bytes, 'UPLOADED')
  RETURNING id INTO _doc_id;

  UPDATE public.transfer_requirements
     SET status = 'UNDER_REVIEW',
         submitted_at = now(),
         rejection_reason_code = NULL
   WHERE id = _req.id;

  IF NOT EXISTS (
    SELECT 1 FROM public.transfer_requirements
     WHERE transfer_id = _t.id
       AND is_mandatory
       AND status IN ('REQUIRED','REPLACEMENT_REQUIRED')
  ) THEN
    UPDATE public.transfer_compliance_cases
       SET status = 'DOCUMENTS_RECEIVED'
     WHERE transfer_id = _t.id;

    UPDATE public.transfers
       SET status = 'COMPLIANCE_REVIEW',
           current_requirement_id = NULL
     WHERE id = _t.id;

    PERFORM public.set_transfer_progress(_t.id, 'DOCUMENT_REVIEW');
    PERFORM public.record_transfer_status(
      _t.id, 'DOCUMENT_REQUIRED', 'COMPLIANCE_REVIEW',
      'DOCUMENTS_RECEIVED', 'CUSTOMER', _user_id
    );
  END IF;

  RETURN _doc_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_transfer_document(
  uuid, text, uuid, text, text, text, bigint
) FROM PUBLIC, anon, authenticated;
