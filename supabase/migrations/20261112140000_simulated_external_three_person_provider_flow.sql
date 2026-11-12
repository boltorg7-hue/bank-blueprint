BEGIN;

-- Replace the SQL-only queue with a server-orchestrated provider submission.
-- The provider result must be simulated and remain pending; 100% is a separate
-- decision made by a third, distinct staff member.
CREATE OR REPLACE FUNCTION public.admin_approve_simulated_external(_reference text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  _t public.transfers%ROWTYPE;
  _simulated boolean;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'compliance.review') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT tr.*
    INTO _t
    FROM public.transfers tr
    JOIN public.external_settlement_rails rail ON rail.id = tr.settlement_rail_id
   WHERE tr.public_reference = _reference
   FOR UPDATE OF tr;

  IF _t.id IS NOT NULL THEN
    SELECT rail.is_simulation
      INTO _simulated
      FROM public.external_settlement_rails rail
     WHERE rail.id = _t.settlement_rail_id;
  END IF;

  IF _t.id IS NULL
     OR NOT COALESCE(_simulated, false)
     OR _t.transfer_kind <> 'EXTERNAL_TRANSFER' THEN
    RAISE EXCEPTION 'INVALID_SIMULATED_TRANSFER';
  END IF;

  IF _t.status = 'APPROVED'
     AND _t.progress_percent = 95
     AND _t.simulation_approved_by = auth.uid() THEN
    RETURN;
  END IF;

  IF _t.status <> 'COMPLIANCE_REVIEW' OR _t.progress_percent <> 90 THEN
    RAISE EXCEPTION 'INVALID_SIMULATED_TRANSFER_TRANSITION';
  END IF;

  IF _t.simulation_approved_by IS NOT NULL THEN
    RAISE EXCEPTION 'SIMULATION_ALREADY_APPROVED';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.transfer_requirements
     WHERE transfer_id = _t.id
       AND is_mandatory
       AND status <> 'SATISFIED'
  ) THEN
    RAISE EXCEPTION 'DOCUMENTS_INCOMPLETE';
  END IF;

  PERFORM public.decide_transfer_compliance(auth.uid(), _reference, 'APPROVE', NULL);

  UPDATE public.transfers
     SET simulation_approved_by = auth.uid()
   WHERE id = _t.id;

  INSERT INTO public.admin_audit_events (
    actor_user_id, action, resource_type, resource_reference,
    permission_checked, result, context
  ) VALUES (
    auth.uid(),
    'external_transfer.approved',
    'transfer',
    _reference,
    'compliance.review',
    'ALLOWED',
    jsonb_build_object('progress_percent', 95, 'simulation', true)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_simulated_external(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_simulated_external(text)
  TO authenticated;

DROP FUNCTION IF EXISTS public.admin_queue_simulated_external(text);

CREATE OR REPLACE FUNCTION public.admin_queue_simulated_external(
  _staff_id uuid,
  _reference text,
  _provider_status public.external_settlement_status,
  _provider_reference text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t public.transfers%ROWTYPE;
  _simulated boolean;
BEGIN
  IF _staff_id IS NULL OR NOT public.has_permission(_staff_id, 'transfers.approve') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF _provider_status NOT IN ('SUBMITTED', 'PENDING')
     OR NULLIF(btrim(COALESCE(_provider_reference, '')), '') IS NULL
     OR char_length(_provider_reference) > 255 THEN
    RAISE EXCEPTION 'INVALID_SIMULATED_PROVIDER_RESULT';
  END IF;

  SELECT tr.*
    INTO _t
    FROM public.transfers tr
    JOIN public.external_settlement_rails rail ON rail.id = tr.settlement_rail_id
   WHERE tr.public_reference = _reference
   FOR UPDATE OF tr;

  IF _t.id IS NOT NULL THEN
    SELECT rail.is_simulation
      INTO _simulated
      FROM public.external_settlement_rails rail
     WHERE rail.id = _t.settlement_rail_id;
  END IF;

  IF _t.id IS NULL
     OR NOT COALESCE(_simulated, false)
     OR _t.transfer_kind <> 'EXTERNAL_TRANSFER'
     OR _t.status <> 'APPROVED'
     OR _t.progress_percent <> 95 THEN
    RAISE EXCEPTION 'INVALID_SIMULATED_TRANSFER_TRANSITION';
  END IF;

  IF _t.simulation_approved_by IS NULL
     OR _t.simulation_approved_by = _staff_id THEN
    RAISE EXCEPTION 'FOUR_EYES_REQUIRED';
  END IF;

  IF _t.simulation_submitted_by IS NOT NULL THEN
    RAISE EXCEPTION 'SIMULATION_ALREADY_QUEUED';
  END IF;

  PERFORM public.submit_external_settlement(_reference);
  PERFORM public.apply_external_settlement_result(
    _reference,
    _provider_status,
    _provider_reference
  );

  UPDATE public.transfers
     SET simulation_submitted_by = _staff_id,
         external_provider_reference = _provider_reference
   WHERE id = _t.id;

  INSERT INTO public.admin_audit_events (
    actor_user_id, action, resource_type, resource_reference,
    permission_checked, result, context
  ) VALUES (
    _staff_id,
    'external_transfer.queued',
    'transfer',
    _reference,
    'transfers.approve',
    'ALLOWED',
    jsonb_build_object(
      'progress_percent', 99,
      'provider_status', _provider_status::text,
      'simulation', true
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_finalize_simulated_external(_reference text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t public.transfers%ROWTYPE;
  _simulated boolean;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'transfers.approve') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT tr.*
    INTO _t
    FROM public.transfers tr
    JOIN public.external_settlement_rails rail ON rail.id = tr.settlement_rail_id
   WHERE tr.public_reference = _reference
   FOR UPDATE OF tr;

  IF _t.id IS NOT NULL THEN
    SELECT rail.is_simulation
      INTO _simulated
      FROM public.external_settlement_rails rail
     WHERE rail.id = _t.settlement_rail_id;
  END IF;

  IF _t.id IS NULL
     OR NOT COALESCE(_simulated, false)
     OR _t.transfer_kind <> 'EXTERNAL_TRANSFER'
     OR _t.status <> 'SETTLEMENT_PENDING'
     OR _t.progress_percent <> 99 THEN
    RAISE EXCEPTION 'INVALID_SIMULATED_TRANSFER_TRANSITION';
  END IF;

  IF _t.simulation_approved_by IS NULL
     OR _t.simulation_submitted_by IS NULL
     OR _t.simulation_approved_by = _t.simulation_submitted_by
     OR auth.uid() = _t.simulation_approved_by
     OR auth.uid() = _t.simulation_submitted_by THEN
    RAISE EXCEPTION 'THREE_PERSON_APPROVAL_REQUIRED';
  END IF;

  IF _t.simulation_finalized_by IS NOT NULL THEN
    RAISE EXCEPTION 'SIMULATION_ALREADY_FINALIZED';
  END IF;

  -- Record the third actor before the completion routine. Any failure rolls
  -- back both the actor marker and the simulated ledger posting.
  UPDATE public.transfers
     SET simulation_finalized_by = auth.uid()
   WHERE id = _t.id;

  PERFORM public.apply_external_settlement_result(
    _reference,
    'SUCCEEDED',
    'ADMIN-SIM-' || replace(gen_random_uuid()::text, '-', '')
  );

  INSERT INTO public.admin_audit_events (
    actor_user_id, action, resource_type, resource_reference,
    permission_checked, result, context
  ) VALUES (
    auth.uid(),
    'external_transfer.finalized',
    'transfer',
    _reference,
    'transfers.approve',
    'ALLOWED',
    jsonb_build_object(
      'progress_percent', 100,
      'simulation', true,
      'first_approver', _t.simulation_approved_by,
      'second_approver', _t.simulation_submitted_by
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_queue_simulated_external(
  uuid, text, public.external_settlement_status, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_queue_simulated_external(
  uuid, text, public.external_settlement_status, text
) TO service_role;

REVOKE ALL ON FUNCTION public.admin_finalize_simulated_external(text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_finalize_simulated_external(text)
  TO authenticated;

COMMIT;
