BEGIN;

-- Lot 1: durable, permission-checked review of simulated external-transfer evidence.
-- The API invokes this SECURITY DEFINER routine with the authenticated staff id;
-- the actor is re-authorized here and is never trusted from the browser alone.

CREATE TABLE public.transfer_document_review_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.transfer_documents(id) ON DELETE RESTRICT,
  transfer_id uuid NOT NULL REFERENCES public.transfers(id) ON DELETE RESTRICT,
  requirement_id uuid REFERENCES public.transfer_requirements(id) ON DELETE SET NULL,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  previous_status public.transfer_document_status NOT NULL,
  new_status public.transfer_document_status NOT NULL,
  decision text NOT NULL CHECK (decision IN ('ACCEPT', 'REQUEST_REPLACEMENT')),
  reason_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transfer_document_review_history_transition_check CHECK (
    (decision = 'ACCEPT' AND new_status = 'ACCEPTED')
    OR (decision = 'REQUEST_REPLACEMENT' AND new_status = 'REJECTED')
  )
);

CREATE INDEX transfer_document_review_history_document_idx
  ON public.transfer_document_review_history(document_id, created_at DESC);
CREATE INDEX transfer_document_review_history_transfer_idx
  ON public.transfer_document_review_history(transfer_id, created_at DESC);

ALTER TABLE public.transfer_document_review_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.transfer_document_review_history TO authenticated;
REVOKE ALL ON public.transfer_document_review_history FROM service_role;
GRANT SELECT ON public.transfer_document_review_history TO service_role;

CREATE POLICY "Transfer document review history compliance readers"
  ON public.transfer_document_review_history
  FOR SELECT TO authenticated
  USING (
    public.has_permission(auth.uid(), 'compliance.review')
    OR public.has_permission(auth.uid(), 'transfers.approve')
  );

-- Review history is append-only: even privileged application roles cannot
-- rewrite, delete or truncate the evidence after a decision has been recorded.
CREATE OR REPLACE FUNCTION public.prevent_transfer_document_review_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RAISE EXCEPTION 'TRANSFER_DOCUMENT_REVIEW_HISTORY_IMMUTABLE';
END;
$$;
REVOKE ALL ON FUNCTION public.prevent_transfer_document_review_history_mutation()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS transfer_document_review_history_no_row_mutation
  ON public.transfer_document_review_history;
CREATE TRIGGER transfer_document_review_history_no_row_mutation
  BEFORE UPDATE OR DELETE ON public.transfer_document_review_history
  FOR EACH ROW EXECUTE FUNCTION public.prevent_transfer_document_review_history_mutation();

DROP TRIGGER IF EXISTS transfer_document_review_history_no_truncate
  ON public.transfer_document_review_history;
CREATE TRIGGER transfer_document_review_history_no_truncate
  BEFORE TRUNCATE ON public.transfer_document_review_history
  FOR EACH STATEMENT EXECUTE FUNCTION public.prevent_transfer_document_review_history_mutation();

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.transfer_document_review_history
  FROM PUBLIC, anon, authenticated, service_role;

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
  _previous_status public.transfer_document_status;
  _new_status public.transfer_document_status;
  _decision text;
  _reason text;
  _requirement_rows integer;
BEGIN
  IF _staff_id IS NULL
     OR NOT public.has_permission(_staff_id, 'compliance.review') THEN
    RAISE EXCEPTION 'NOT_AUTHORISED';
  END IF;

  IF _accept IS NULL THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT_DECISION';
  END IF;

  _reason := NULLIF(btrim(COALESCE(_reason_code, '')), '');
  IF NOT _accept AND char_length(COALESCE(_reason, '')) NOT BETWEEN 8 AND 500 THEN
    RAISE EXCEPTION 'DOCUMENT_REJECTION_REASON_REQUIRED';
  END IF;

  SELECT *
    INTO _doc
    FROM public.transfer_documents
   WHERE id = _document_id
   FOR UPDATE;

  IF _doc.id IS NULL THEN
    RAISE EXCEPTION 'DOCUMENT_UNAVAILABLE';
  END IF;

  -- Exact retries remain idempotent, while contradictory retries are rejected.
  _decision := CASE WHEN _accept THEN 'ACCEPT' ELSE 'REQUEST_REPLACEMENT' END;

  IF _doc.status IN ('ACCEPTED', 'REJECTED') THEN
    IF ((_doc.status = 'ACCEPTED' AND _accept)
        OR (_doc.status = 'REJECTED' AND NOT _accept))
       AND EXISTS (
         SELECT 1
           FROM public.transfer_document_review_history
          WHERE document_id = _doc.id
            AND actor_user_id = _staff_id
            AND decision = _decision
            AND reason_code IS NOT DISTINCT FROM _reason
       ) THEN
      RETURN;
    END IF;
    RAISE EXCEPTION 'DOCUMENT_ALREADY_FINALIZED';
  END IF;

  -- The upload routine persists new evidence as UPLOADED; that is also a valid pending-review state.
  IF _doc.status NOT IN ('UPLOADED', 'UNDER_REVIEW') THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT_STATE';
  END IF;

  SELECT *
    INTO _t
    FROM public.transfers
   WHERE id = _doc.transfer_id
   FOR UPDATE;

  IF _t.id IS NULL THEN
    RAISE EXCEPTION 'TRANSFER_UNAVAILABLE';
  END IF;

  IF _t.transfer_kind <> 'EXTERNAL_TRANSFER'
     OR _t.sender_user_id <> _doc.user_id THEN
    RAISE EXCEPTION 'TRANSFER_DOCUMENT_UNAVAILABLE';
  END IF;

  _previous_status := _doc.status;
  _new_status := CASE
    WHEN _accept THEN 'ACCEPTED'::public.transfer_document_status
    ELSE 'REJECTED'::public.transfer_document_status
  END;
  UPDATE public.transfer_documents
     SET status = _new_status,
         rejection_reason_code = CASE WHEN _accept THEN NULL ELSE _reason END,
         reviewed_at = now()
   WHERE id = _document_id;

  IF _doc.requirement_id IS NOT NULL THEN
    UPDATE public.transfer_requirements
       SET status = CASE
                      WHEN _accept THEN 'SATISFIED'::public.transfer_requirement_status
                      ELSE 'REPLACEMENT_REQUIRED'::public.transfer_requirement_status
                    END,
           rejection_reason_code = CASE WHEN _accept THEN NULL ELSE _reason END,
           reviewed_at = now()
     WHERE id = _doc.requirement_id
       AND transfer_id = _doc.transfer_id
       AND user_id = _doc.user_id;

    GET DIAGNOSTICS _requirement_rows = ROW_COUNT;
    IF _requirement_rows <> 1 THEN
      RAISE EXCEPTION 'DOCUMENT_REQUIREMENT_UNAVAILABLE';
    END IF;
  END IF;

  INSERT INTO public.transfer_document_review_history (
    document_id, transfer_id, requirement_id, actor_user_id,
    previous_status, new_status, decision, reason_code
  ) VALUES (
    _doc.id, _doc.transfer_id, _doc.requirement_id, _staff_id,
    _previous_status, _new_status, _decision, _reason
  );

  -- The dedicated immutable history is authoritative; the general admin audit
  -- event supplements it without storing document contents or personal data.
  INSERT INTO public.admin_audit_events (
    actor_user_id, action, resource_type, resource_reference,
    permission_checked, result, context
  ) VALUES (
    _staff_id,
    CASE WHEN _accept THEN 'transfer.document.accepted'
         ELSE 'transfer.document.replacement_requested' END,
    'transfer_document',
    _doc.id::text,
    'compliance.review',
    'ALLOWED',
    jsonb_build_object(
      'transfer_reference', _t.public_reference,
      'document_type', _doc.document_type,
      'decision', _decision,
      'previous_status', _previous_status::text,
      'new_status', _new_status::text
    )
  );

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

      UPDATE public.transfer_compliance_cases
         SET status = 'UNDER_REVIEW',
             reviewed_at = now()
       WHERE transfer_id = _t.id;

      IF _t.status <> 'COMPLIANCE_REVIEW' THEN
        PERFORM public.record_transfer_status(
          _t.id,
          _t.status,
          'COMPLIANCE_REVIEW',
          'DOCUMENTS_ACCEPTED',
          'COMPLIANCE',
          _staff_id
        );
      END IF;

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
      _t.status,
      'DOCUMENT_REQUIRED',
      'DOCUMENT_REJECTED',
      'COMPLIANCE',
      _staff_id
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_transfer_document(uuid, uuid, boolean, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_transfer_document(uuid, uuid, boolean, text)
  TO service_role;

COMMIT;
