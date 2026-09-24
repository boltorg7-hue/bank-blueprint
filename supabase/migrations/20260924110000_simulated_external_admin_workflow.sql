-- STEP 4 — Explicit 95 -> 99 -> 100 administrative simulation workflow.
ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS simulation_approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS simulation_submitted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS simulation_finalized_by uuid REFERENCES auth.users(id);

INSERT INTO public.role_permissions(role,permission) VALUES
  ('supervisor','transfers.approve'),('super_admin','transfers.approve') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.admin_approve_simulated_external(_reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _t public.transfers%ROWTYPE;
BEGIN
  IF NOT public.has_permission(auth.uid(),'compliance.review') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _t FROM public.transfers WHERE public_reference=_reference FOR UPDATE;
  IF _t.transfer_kind<>'EXTERNAL_TRANSFER' OR _t.status<>'COMPLIANCE_REVIEW' THEN RAISE EXCEPTION 'invalid transition'; END IF;
  IF EXISTS(SELECT 1 FROM public.transfer_requirements WHERE transfer_id=_t.id AND is_mandatory AND status<>'SATISFIED') THEN RAISE EXCEPTION 'documents incomplete'; END IF;
  PERFORM public.decide_transfer_compliance(auth.uid(),_reference,'APPROVE',NULL);
  UPDATE public.transfers SET simulation_approved_by=auth.uid() WHERE id=_t.id;
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
  VALUES(auth.uid(),'external_transfer.approved','transfer',_reference,'compliance.review','ALLOWED',jsonb_build_object('progress_percent',95));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_queue_simulated_external(_reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _t public.transfers%ROWTYPE; _simulated boolean;
BEGIN
  IF NOT public.has_permission(auth.uid(),'transfers.approve') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT tr,rail.is_simulation INTO _t,_simulated FROM public.transfers tr JOIN public.external_settlement_rails rail ON rail.id=tr.settlement_rail_id WHERE tr.public_reference=_reference FOR UPDATE OF tr;
  IF _t.id IS NULL OR NOT _simulated OR _t.status<>'APPROVED' THEN RAISE EXCEPTION 'invalid transition'; END IF;
  IF _t.simulation_approved_by=auth.uid() THEN RAISE EXCEPTION 'four-eyes approval required'; END IF;
  PERFORM public.submit_external_settlement(_reference);
  UPDATE public.transfers SET simulation_submitted_by=auth.uid() WHERE id=_t.id;
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
  VALUES(auth.uid(),'external_transfer.queued','transfer',_reference,'transfers.approve','ALLOWED',jsonb_build_object('progress_percent',99));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_finalize_simulated_external(_reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _t public.transfers%ROWTYPE; _simulated boolean;
BEGIN
  IF NOT public.has_permission(auth.uid(),'transfers.approve') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT tr,rail.is_simulation INTO _t,_simulated FROM public.transfers tr JOIN public.external_settlement_rails rail ON rail.id=tr.settlement_rail_id WHERE tr.public_reference=_reference FOR UPDATE OF tr;
  IF _t.id IS NULL OR NOT _simulated OR _t.status<>'SETTLEMENT_PENDING' OR _t.progress_percent<>99 THEN RAISE EXCEPTION 'invalid transition'; END IF;
  IF _t.simulation_submitted_by=auth.uid() THEN RAISE EXCEPTION 'four-eyes approval required'; END IF;
  PERFORM public.apply_external_settlement_result(_reference,'SUCCEEDED','ADMIN-SIM-'||replace(gen_random_uuid()::text,'-',''));
  UPDATE public.transfers SET simulation_finalized_by=auth.uid() WHERE id=_t.id;
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
  VALUES(auth.uid(),'external_transfer.finalized','transfer',_reference,'transfers.approve','ALLOWED',jsonb_build_object('progress_percent',100,'simulation',true));
END; $$;

REVOKE ALL ON FUNCTION public.admin_approve_simulated_external(text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_queue_simulated_external(text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_finalize_simulated_external(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_simulated_external(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_queue_simulated_external(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_finalize_simulated_external(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_external_transfer_progress() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.transfer_kind='EXTERNAL_TRANSFER' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status='DOCUMENT_REQUIRED' THEN PERFORM public.emit_customer_notification(NEW.sender_user_id,'external.document:'||NEW.id,'TRANSFER','WARNING','Document requis','Un justificatif est nécessaire pour poursuivre votre transfert externe.','/app/transfers/'||NEW.public_reference,NULL,'{}');
    ELSIF NEW.status='SETTLEMENT_PENDING' THEN PERFORM public.emit_customer_notification(NEW.sender_user_id,'external.pending:'||NEW.id,'TRANSFER','INFO','Validation finale en attente','Votre transfert simulé est à 99 % et attend la décision finale.','/app/transfers/'||NEW.public_reference,NULL,'{}');
    ELSIF NEW.status='COMPLETED' THEN PERFORM public.emit_customer_notification(NEW.sender_user_id,'external.completed:'||NEW.id,'TRANSFER','SUCCESS','Transfert simulé finalisé','Le parcours de simulation du transfert est terminé.','/app/transfers/'||NEW.public_reference,'TRANSFER_EXTERNAL_COMPLETED',jsonb_build_object('reference',NEW.public_reference)); END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS external_transfer_progress_notification ON public.transfers;
CREATE TRIGGER external_transfer_progress_notification AFTER UPDATE OF status ON public.transfers FOR EACH ROW EXECUTE FUNCTION public.notify_external_transfer_progress();
REVOKE ALL ON FUNCTION public.notify_external_transfer_progress() FROM PUBLIC,anon,authenticated;
