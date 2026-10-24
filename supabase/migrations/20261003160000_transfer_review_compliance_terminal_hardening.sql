-- 5.9.9.9 — terminal-state guards for document review and compliance decisions.
-- Prevents contradictory retries after a document/compliance decision has already
-- reached a terminal state. Row locks preserve concurrency safety.

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
DECLARE
  _doc public.transfer_documents;
  _t public.transfers;
BEGIN
  IF NOT public.is_staff(_staff_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORISED';
  END IF;

  SELECT * INTO _doc
  FROM public.transfer_documents
  WHERE id = _document_id
  FOR UPDATE;

  IF _doc.id IS NULL THEN
    RAISE EXCEPTION 'DOCUMENT_UNAVAILABLE';
  END IF;

  -- A reviewed document is terminal. An exact replay is idempotent;
  -- a contradictory second decision is rejected.
  IF _doc.status IN ('ACCEPTED','REJECTED') THEN
    IF (_doc.status = 'ACCEPTED' AND _accept)
       OR (_doc.status = 'REJECTED' AND NOT _accept) THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'DOCUMENT_ALREADY_FINALIZED';
  END IF;

  IF _doc.status <> 'UNDER_REVIEW' THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT_STATE';
  END IF;

  SELECT * INTO _t
  FROM public.transfers
  WHERE id = _doc.transfer_id
  FOR UPDATE;

  IF _t.id IS NULL THEN
    RAISE EXCEPTION 'TRANSFER_UNAVAILABLE';
  END IF;

  UPDATE public.transfer_documents
     SET status = CASE
                    WHEN _accept THEN 'ACCEPTED'::public.transfer_document_status
                    ELSE 'REJECTED'::public.transfer_document_status
                  END,
         rejection_reason_code = CASE WHEN _accept THEN NULL ELSE _reason_code END,
         reviewed_at = now()
   WHERE id = _document_id;

  UPDATE public.transfer_requirements
     SET status = CASE
                    WHEN _accept THEN 'SATISFIED'::public.transfer_requirement_status
                    ELSE 'REPLACEMENT_REQUIRED'::public.transfer_requirement_status
                  END,
         rejection_reason_code = CASE WHEN _accept THEN NULL ELSE _reason_code END,
         reviewed_at = now()
   WHERE id = _doc.requirement_id;

  IF _accept THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.transfer_requirements
      WHERE transfer_id = _t.id
        AND is_mandatory
        AND status <> 'SATISFIED'
    ) THEN
      UPDATE public.transfers
         SET status = 'COMPLIANCE_REVIEW'
       WHERE id = _t.id;
      PERFORM public.set_transfer_progress(_t.id, 'FINAL_REVIEW');
    END IF;
  ELSE
    UPDATE public.transfers
       SET status = 'DOCUMENT_REQUIRED',
           current_requirement_id = _doc.requirement_id
     WHERE id = _t.id;

    UPDATE public.transfer_compliance_cases
       SET status = 'CUSTOMER_ACTION_REQUIRED'
     WHERE transfer_id = _t.id;

    PERFORM public.set_transfer_progress(_t.id, 'DOCUMENT_REQUIRED');
    PERFORM public.record_transfer_status(
      _t.id,
      'COMPLIANCE_REVIEW',
      'DOCUMENT_REQUIRED',
      'DOCUMENT_REJECTED',
      'COMPLIANCE',
      _staff_id
    );
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
DECLARE
  _t public.transfers;
BEGIN
  IF NOT public.is_staff(_staff_id) THEN
    RAISE EXCEPTION 'NOT_AUTHORISED';
  END IF;

  SELECT * INTO _t
  FROM public.transfers
  WHERE public_reference = _reference
  FOR UPDATE;

  IF _t.id IS NULL THEN
    RAISE EXCEPTION 'TRANSFER_UNAVAILABLE';
  END IF;

  -- Compliance decisions are terminal once applied. Exact retries are
  -- idempotent; a different decision cannot reopen or rewrite the case.
  IF _t.status IN ('APPROVED','REJECTED','BLOCKED','COMPLETED','SETTLEMENT_PENDING') THEN
    IF (_t.status = 'APPROVED' AND _decision = 'APPROVE')
       OR (_t.status = 'REJECTED' AND _decision = 'REJECT')
       OR (_t.status = 'BLOCKED' AND _decision = 'BLOCK') THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'COMPLIANCE_ALREADY_FINALIZED';
  END IF;

  IF _t.status <> 'COMPLIANCE_REVIEW' THEN
    RAISE EXCEPTION 'INVALID_COMPLIANCE_STATE';
  END IF;

  IF _decision = 'APPROVE' THEN
    UPDATE public.transfers
       SET status = 'APPROVED',
           approved_at = now()
     WHERE id = _t.id;

    UPDATE public.transfer_compliance_cases
       SET status = 'APPROVED',
           reviewed_at = now(),
           decision_at = now()
     WHERE transfer_id = _t.id;

    PERFORM public.set_transfer_progress(_t.id, 'APPROVED');
    PERFORM public.record_transfer_status(
      _t.id,
      _t.status,
      'APPROVED',
      'COMPLIANCE_APPROVED',
      'COMPLIANCE',
      _staff_id
    );

  ELSIF _decision = 'REJECT' THEN
    IF _t.hold_id IS NOT NULL THEN
      PERFORM public.release_account_hold(_t.hold_id);
    END IF;

    UPDATE public.transfers
       SET status = 'REJECTED',
           failure_code = COALESCE(_reason_code, 'COMPLIANCE_REJECTED'),
           failed_at = now(),
           progress_state = 'FAILED',
           finalized_at = now()
     WHERE id = _t.id;

    UPDATE public.transfer_compliance_cases
       SET status = 'REJECTED',
           reviewed_at = now(),
           decision_at = now()
     WHERE transfer_id = _t.id;

    PERFORM public.record_transfer_status(
      _t.id,
      _t.status,
      'REJECTED',
      'COMPLIANCE_REJECTED',
      'COMPLIANCE',
      _staff_id
    );

  ELSIF _decision = 'BLOCK' THEN
    -- BLOCKED keeps the hold and freezes progress: BLOCKED is not FAILED.
    UPDATE public.transfers
       SET status = 'BLOCKED'
     WHERE id = _t.id;

    PERFORM public.set_transfer_progress(_t.id, 'BLOCKED', true);
    PERFORM public.record_transfer_status(
      _t.id,
      _t.status,
      'BLOCKED',
      COALESCE(_reason_code, 'BLOCKED'),
      'COMPLIANCE',
      _staff_id
    );

  ELSE
    RAISE EXCEPTION 'INVALID_DECISION';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_transfer_document(uuid, uuid, boolean, text)
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.decide_transfer_compliance(uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;
