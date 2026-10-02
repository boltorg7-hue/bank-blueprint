-- STEP 9.3 — Harden notification trigger call signatures.
-- The notification emitter accepts exactly seven arguments.
-- Older functions still passed legacy metadata arguments; keep the original
-- authorization/behavior while removing those invalid arguments.

CREATE OR REPLACE FUNCTION public.staff_reply_support_thread(_thread_id uuid,_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _thread public.support_threads%ROWTYPE; _message_id uuid;
BEGIN
  IF NOT public.has_permission(auth.uid(),'support.reply') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _thread FROM public.support_threads WHERE id=_thread_id FOR UPDATE;
  IF _thread.id IS NULL OR _thread.status='CLOSED' THEN RAISE EXCEPTION 'thread unavailable'; END IF;
  IF char_length(trim(coalesce(_body,''))) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'invalid message'; END IF;
  INSERT INTO public.support_messages(thread_id,author_user_id,author_kind,body)
  VALUES(_thread.id,auth.uid(),'STAFF',trim(_body)) RETURNING id INTO _message_id;
  UPDATE public.support_threads SET status='WAITING_CUSTOMER',assigned_staff_id=coalesce(assigned_staff_id,auth.uid()),last_message_at=now(),updated_at=now() WHERE id=_thread.id;
  PERFORM public.emit_customer_notification(_thread.customer_user_id,'support.reply:'||_message_id,'SERVICE','INFO','Nouvelle réponse du service client','Le service client a répondu à votre demande.','/app/messages');
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
  VALUES(auth.uid(),'support.replied','support_thread',_thread.public_reference,'support.reply','ALLOWED',jsonb_build_object('message_id',_message_id));
  RETURN _message_id;
END; $$;

CREATE OR REPLACE FUNCTION public.record_customer_password_changed()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _session_id text := auth.jwt()->>'session_id';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  INSERT INTO public.customer_security_events(user_id,event_type,title,detail,auth_session_id)
  VALUES(auth.uid(),'PASSWORD_CHANGED','Mot de passe modifié','Le mot de passe de votre compte a été modifié.',_session_id);
  PERFORM public.emit_customer_notification(auth.uid(),'security.password:'||gen_random_uuid(),'SECURITY','WARNING','Mot de passe modifié','Votre mot de passe vient d’être modifié. Si vous n’êtes pas à l’origine de cette action, contactez immédiatement le service client.','/app/security');
END; $$;

CREATE OR REPLACE FUNCTION public.notify_external_transfer_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.transfer_kind='EXTERNAL_TRANSFER' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status='DOCUMENT_REQUIRED' THEN
      PERFORM public.emit_customer_notification(NEW.sender_user_id,'external.document:'||NEW.id,'TRANSFER','WARNING','Document requis','Un justificatif est nécessaire pour poursuivre votre transfert externe.','/app/transfers/'||NEW.public_reference);
    ELSIF NEW.status='SETTLEMENT_PENDING' THEN
      PERFORM public.emit_customer_notification(NEW.sender_user_id,'external.pending:'||NEW.id,'TRANSFER','INFO','Validation finale en attente','Votre transfert simulé est à 99 % et attend la décision finale.','/app/transfers/'||NEW.public_reference);
    ELSIF NEW.status='COMPLETED' THEN
      PERFORM public.emit_customer_notification(NEW.sender_user_id,'external.completed:'||NEW.id,'TRANSFER','SUCCESS','Transfert simulé finalisé','Le parcours de simulation du transfert est terminé.','/app/transfers/'||NEW.public_reference);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.notify_external_transfer_progress() FROM PUBLIC,anon,authenticated;
