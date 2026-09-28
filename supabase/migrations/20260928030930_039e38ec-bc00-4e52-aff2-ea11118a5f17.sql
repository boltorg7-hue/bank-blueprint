INSERT INTO public.role_permissions (role, permission) VALUES ('administrator','customers.write'),('administrator','accounts.manage'),('super_admin','customers.write'),('super_admin','accounts.manage') ON CONFLICT DO NOTHING;
REVOKE ALL ON FUNCTION public.create_funding_request(text, bigint, text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.decide_funding_request(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_funding_request(text, bigint, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_funding_request(uuid, boolean) TO authenticated;
CREATE INDEX IF NOT EXISTS funding_requests_status_created_idx ON public.funding_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS funding_requests_account_created_idx ON public.funding_requests(account_id, created_at DESC);
COMMENT ON TABLE public.funding_requests IS 'Maker-checker requests for simulated account funding. Approval posts an immutable balanced ledger transaction.';
CREATE OR REPLACE FUNCTION public.decide_funding_request(_request_id uuid, _approve boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _request public.funding_requests%ROWTYPE;
  _account public.bank_accounts%ROWTYPE;
  _customer_ledger uuid;
  _clearing uuid;
  _posted record;
  _ledger_transaction_id uuid := NULL;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'finance.adjustment.approve') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _request FROM public.funding_requests WHERE id = _request_id FOR UPDATE;
  IF _request.id IS NULL THEN RAISE EXCEPTION 'request not found'; END IF;
  IF _request.maker_user_id = auth.uid() THEN RAISE EXCEPTION 'four-eyes approval required'; END IF;
  IF _request.status <> 'PENDING' THEN RAISE EXCEPTION 'already decided'; END IF;
  IF _approve IS NULL THEN RAISE EXCEPTION 'invalid decision'; END IF;
  IF _approve THEN
    SELECT * INTO _account FROM public.bank_accounts WHERE id = _request.account_id FOR UPDATE;
    IF _account.status <> 'ACTIVE' OR _account.currency <> 'USD' THEN RAISE EXCEPTION 'account unavailable'; END IF;
    SELECT id INTO _customer_ledger FROM public.ledger_accounts WHERE bank_account_id = _account.id AND currency = 'USD' AND status = 'ACTIVE';
    SELECT id INTO _clearing FROM public.ledger_accounts WHERE code = 'SETTLEMENT_CLEARING.USD' AND status = 'ACTIVE';
    IF _customer_ledger IS NULL OR _clearing IS NULL THEN RAISE EXCEPTION 'ledger account unavailable'; END IF;
    SELECT * INTO _posted FROM public.post_ledger_transaction('FUNDING'::public.ledger_transaction_type,'USD','Approvisionnement validé','ADMIN_FUNDING',_request.id::text,'funding:'||_request.id::text,jsonb_build_array(jsonb_build_object('ledgerAccountId',_clearing,'side','DEBIT','amountMinor',_request.amount_minor),jsonb_build_object('ledgerAccountId',_customer_ledger,'side','CREDIT','amountMinor',_request.amount_minor)),auth.uid(),'{}'::jsonb,NULL::uuid);
    _ledger_transaction_id := _posted.id;
    UPDATE public.funding_requests SET status='APPROVED',checker_user_id=auth.uid(),decision_at=now(),ledger_transaction_id=_ledger_transaction_id WHERE id=_request.id;
  ELSE
    UPDATE public.funding_requests SET status='REJECTED',checker_user_id=auth.uid(),decision_at=now() WHERE id=_request.id;
  END IF;
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES (auth.uid(),CASE WHEN _approve THEN 'funding.approved' ELSE 'funding.rejected' END,'funding_request',_request.id::text,'finance.adjustment.approve','ALLOWED',jsonb_build_object('ledger_transaction_id',_ledger_transaction_id));
  RETURN jsonb_build_object('id',_request.id,'status',CASE WHEN _approve THEN 'APPROVED' ELSE 'REJECTED' END,'ledger_transaction_id',_ledger_transaction_id);
END; $$;
REVOKE ALL ON FUNCTION public.decide_funding_request(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_funding_request(uuid, boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.admin_set_customer_state(_customer_id uuid,_state public.customer_lifecycle_state,_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _previous public.customer_lifecycle_state;
BEGIN
  IF NOT public.has_permission(auth.uid(),'customers.write') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _state NOT IN ('ACTIVE','RESTRICTED','SUSPENDED') OR char_length(trim(coalesce(_reason,''))) NOT BETWEEN 8 AND 300 THEN RAISE EXCEPTION 'invalid state change'; END IF;
  SELECT lifecycle_state INTO _previous FROM public.profiles WHERE id=_customer_id FOR UPDATE;
  IF _previous IS NULL THEN RAISE EXCEPTION 'customer not found'; END IF;
  IF _state='ACTIVE' AND NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE user_id=_customer_id) THEN RAISE EXCEPTION 'account required before activation'; END IF;
  UPDATE public.profiles SET lifecycle_state=_state WHERE id=_customer_id;
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES (auth.uid(),'customer.state_changed','customer',_customer_id::text,'customers.write','ALLOWED',jsonb_build_object('previous',_previous,'new',_state,'reason',trim(_reason)));
END; $$;
REVOKE ALL ON FUNCTION public.admin_set_customer_state(uuid, public.customer_lifecycle_state, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_customer_state(uuid, public.customer_lifecycle_state, text) TO authenticated;
CREATE OR REPLACE FUNCTION public.admin_set_account_status(_account_reference text,_status public.bank_account_status,_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _account public.bank_accounts%ROWTYPE;
BEGIN
  IF NOT public.has_permission(auth.uid(),'accounts.manage') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _status NOT IN ('ACTIVE','RESTRICTED','SUSPENDED','FROZEN') OR char_length(trim(coalesce(_reason,''))) NOT BETWEEN 8 AND 300 THEN RAISE EXCEPTION 'invalid status change'; END IF;
  SELECT * INTO _account FROM public.bank_accounts WHERE public_reference=_account_reference FOR UPDATE;
  IF _account.id IS NULL THEN RAISE EXCEPTION 'account not found'; END IF;
  IF _account.status='CLOSED' THEN RAISE EXCEPTION 'closed account immutable'; END IF;
  UPDATE public.bank_accounts SET status=_status WHERE id=_account.id;
  INSERT INTO public.account_status_history(account_id,user_id,previous_status,new_status,reason_category,internal_note,changed_by) VALUES (_account.id,_account.user_id,_account.status,_status,'ADMIN_ACTION',trim(_reason),auth.uid());
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES (auth.uid(),'account.status_changed','bank_account',_account_reference,'accounts.manage','ALLOWED',jsonb_build_object('previous',_account.status,'new',_status,'reason',trim(_reason)));
END; $$;
REVOKE ALL ON FUNCTION public.admin_set_account_status(text, public.bank_account_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(text, public.bank_account_status, text) TO authenticated;
CREATE TABLE public.customer_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'fr' CHECK (language IN ('fr','en')),
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  privacy_mode_default boolean NOT NULL DEFAULT false,
  sms_transactions boolean NOT NULL DEFAULT true,
  sms_security boolean NOT NULL DEFAULT true,
  email_service boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.customer_preferences TO authenticated;
GRANT ALL ON public.customer_preferences TO service_role;
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers read own preferences" ON public.customer_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "customers create own preferences" ON public.customer_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "customers update own preferences" ON public.customer_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER customer_preferences_updated BEFORE UPDATE ON public.customer_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
COMMENT ON TABLE public.customer_preferences IS 'Non-financial presentation and communication preferences. Identity, lifecycle and account state remain in their authoritative domains.';
ALTER TABLE public.transfers ADD COLUMN IF NOT EXISTS simulation_approved_by uuid REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS simulation_submitted_by uuid REFERENCES auth.users(id), ADD COLUMN IF NOT EXISTS simulation_finalized_by uuid REFERENCES auth.users(id);
INSERT INTO public.role_permissions(role,permission) VALUES ('supervisor','transfers.approve'),('super_admin','transfers.approve') ON CONFLICT DO NOTHING;
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
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES(auth.uid(),'external_transfer.approved','transfer',_reference,'compliance.review','ALLOWED',jsonb_build_object('progress_percent',95));
END; $$;
CREATE OR REPLACE FUNCTION public.admin_queue_simulated_external(_reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _t public.transfers%ROWTYPE; _simulated boolean;
BEGIN
  IF NOT public.has_permission(auth.uid(),'transfers.approve') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _t FROM public.transfers WHERE public_reference=_reference FOR UPDATE;
  IF _t.id IS NULL OR _t.status<>'APPROVED' THEN RAISE EXCEPTION 'invalid transition'; END IF;
  SELECT rail.is_simulation INTO _simulated FROM public.external_settlement_rails rail WHERE rail.id=_t.settlement_rail_id;
  IF NOT coalesce(_simulated,false) THEN RAISE EXCEPTION 'invalid transition'; END IF;
  IF _t.simulation_approved_by=auth.uid() THEN RAISE EXCEPTION 'four-eyes approval required'; END IF;
  PERFORM public.submit_external_settlement(_reference);
  UPDATE public.transfers SET simulation_submitted_by=auth.uid() WHERE id=_t.id;
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES(auth.uid(),'external_transfer.queued','transfer',_reference,'transfers.approve','ALLOWED',jsonb_build_object('progress_percent',99));
END; $$;
CREATE OR REPLACE FUNCTION public.admin_finalize_simulated_external(_reference text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _t public.transfers%ROWTYPE; _simulated boolean;
BEGIN
  IF NOT public.has_permission(auth.uid(),'transfers.approve') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _t FROM public.transfers WHERE public_reference=_reference FOR UPDATE;
  IF _t.id IS NULL OR _t.status<>'SETTLEMENT_PENDING' OR _t.progress_percent<>99 THEN RAISE EXCEPTION 'invalid transition'; END IF;
  SELECT rail.is_simulation INTO _simulated FROM public.external_settlement_rails rail WHERE rail.id=_t.settlement_rail_id;
  IF NOT coalesce(_simulated,false) THEN RAISE EXCEPTION 'invalid transition'; END IF;
  IF _t.simulation_submitted_by=auth.uid() THEN RAISE EXCEPTION 'four-eyes approval required'; END IF;
  PERFORM public.apply_external_settlement_result(_reference,'SUCCEEDED','ADMIN-SIM-'||replace(gen_random_uuid()::text,'-',''));
  UPDATE public.transfers SET simulation_finalized_by=auth.uid() WHERE id=_t.id;
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES(auth.uid(),'external_transfer.finalized','transfer',_reference,'transfers.approve','ALLOWED',jsonb_build_object('progress_percent',100,'simulation',true));
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
INSERT INTO public.role_permissions(role,permission) VALUES ('support_agent','support.read'),('support_agent','support.reply'),('supervisor','support.read'),('supervisor','support.reply'),('administrator','support.read'),('administrator','support.reply'),('super_admin','support.read'),('super_admin','support.reply') ON CONFLICT DO NOTHING;
CREATE TABLE public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference text NOT NULL UNIQUE DEFAULT ('SUP-' || to_char(now(),'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  customer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 5 AND 120),
  category text NOT NULL CHECK (category IN ('ACCOUNT','TRANSFER','DOCUMENT','SECURITY','OTHER')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','WAITING_SUPPORT','WAITING_CUSTOMER','RESOLVED','CLOSED')),
  assigned_staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  author_kind text NOT NULL CHECK (author_kind IN ('CUSTOMER','STAFF')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_threads_customer_updated_idx ON public.support_threads(customer_user_id,last_message_at DESC);
CREATE INDEX support_threads_status_updated_idx ON public.support_threads(status,last_message_at DESC);
CREATE INDEX support_messages_thread_created_idx ON public.support_messages(thread_id,created_at);
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.support_threads,public.support_messages TO authenticated;
GRANT ALL ON public.support_threads,public.support_messages TO service_role;
CREATE POLICY "Customers read own support threads" ON public.support_threads FOR SELECT TO authenticated USING (customer_user_id=auth.uid() OR public.has_permission(auth.uid(),'support.read'));
CREATE POLICY "Customers read own support messages" ON public.support_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.support_threads t WHERE t.id=thread_id AND (t.customer_user_id=auth.uid() OR public.has_permission(auth.uid(),'support.read'))));
CREATE OR REPLACE FUNCTION public.create_support_thread(_subject text,_category text,_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _thread_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF char_length(trim(coalesce(_subject,''))) NOT BETWEEN 5 AND 120 THEN RAISE EXCEPTION 'invalid subject'; END IF;
  IF _category NOT IN ('ACCOUNT','TRANSFER','DOCUMENT','SECURITY','OTHER') THEN RAISE EXCEPTION 'invalid category'; END IF;
  IF char_length(trim(coalesce(_body,''))) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'invalid message'; END IF;
  INSERT INTO public.support_threads(customer_user_id,subject,category,status) VALUES(auth.uid(),trim(_subject),_category,'WAITING_SUPPORT') RETURNING id INTO _thread_id;
  INSERT INTO public.support_messages(thread_id,author_user_id,author_kind,body) VALUES(_thread_id,auth.uid(),'CUSTOMER',trim(_body));
  RETURN _thread_id;
END; $$;
CREATE OR REPLACE FUNCTION public.reply_support_thread(_thread_id uuid,_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _thread public.support_threads%ROWTYPE; _message_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  SELECT * INTO _thread FROM public.support_threads WHERE id=_thread_id FOR UPDATE;
  IF _thread.id IS NULL OR _thread.customer_user_id<>auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _thread.status IN ('CLOSED','RESOLVED') THEN RAISE EXCEPTION 'thread closed'; END IF;
  IF char_length(trim(coalesce(_body,''))) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'invalid message'; END IF;
  INSERT INTO public.support_messages(thread_id,author_user_id,author_kind,body) VALUES(_thread.id,auth.uid(),'CUSTOMER',trim(_body)) RETURNING id INTO _message_id;
  UPDATE public.support_threads SET status='WAITING_SUPPORT',last_message_at=now(),updated_at=now() WHERE id=_thread.id;
  RETURN _message_id;
END; $$;
CREATE OR REPLACE FUNCTION public.staff_reply_support_thread(_thread_id uuid,_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _thread public.support_threads%ROWTYPE; _message_id uuid;
BEGIN
  IF NOT public.has_permission(auth.uid(),'support.reply') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO _thread FROM public.support_threads WHERE id=_thread_id FOR UPDATE;
  IF _thread.id IS NULL OR _thread.status='CLOSED' THEN RAISE EXCEPTION 'thread unavailable'; END IF;
  IF char_length(trim(coalesce(_body,''))) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'invalid message'; END IF;
  INSERT INTO public.support_messages(thread_id,author_user_id,author_kind,body) VALUES(_thread.id,auth.uid(),'STAFF',trim(_body)) RETURNING id INTO _message_id;
  UPDATE public.support_threads SET status='WAITING_CUSTOMER',assigned_staff_id=coalesce(assigned_staff_id,auth.uid()),last_message_at=now(),updated_at=now() WHERE id=_thread.id;
  PERFORM public.emit_customer_notification(_thread.customer_user_id,'support.reply:'||_message_id,'SERVICE','INFO','Nouvelle réponse du service client','Le service client a répondu à votre demande.','/app/messages',NULL,jsonb_build_object('threadId',_thread.id));
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES(auth.uid(),'support.replied','support_thread',_thread.public_reference,'support.reply','ALLOWED',jsonb_build_object('message_id',_message_id));
  RETURN _message_id;
END; $$;
CREATE OR REPLACE FUNCTION public.staff_set_support_status(_thread_id uuid,_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _thread public.support_threads%ROWTYPE;
BEGIN
  IF NOT public.has_permission(auth.uid(),'support.reply') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _status NOT IN ('OPEN','WAITING_SUPPORT','WAITING_CUSTOMER','RESOLVED','CLOSED') THEN RAISE EXCEPTION 'invalid status'; END IF;
  SELECT * INTO _thread FROM public.support_threads WHERE id=_thread_id FOR UPDATE;
  IF _thread.id IS NULL THEN RAISE EXCEPTION 'thread unavailable'; END IF;
  UPDATE public.support_threads SET status=_status,assigned_staff_id=coalesce(assigned_staff_id,auth.uid()),updated_at=now(),closed_at=CASE WHEN _status='CLOSED' THEN now() ELSE NULL END WHERE id=_thread.id;
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context) VALUES(auth.uid(),'support.status_changed','support_thread',_thread.public_reference,'support.reply','ALLOWED',jsonb_build_object('previous',_thread.status,'new',_status));
END; $$;
REVOKE ALL ON FUNCTION public.create_support_thread(text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.reply_support_thread(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.staff_reply_support_thread(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.staff_set_support_status(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_support_thread(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reply_support_thread(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_reply_support_thread(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_set_support_status(uuid,text) TO authenticated;
CREATE TABLE public.customer_security_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_session_id text NOT NULL,
  device_label text NOT NULL DEFAULT 'Navigateur' CHECK (char_length(device_label) BETWEEN 2 AND 240),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE(user_id,auth_session_id)
);
CREATE TABLE public.customer_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('SESSION_SEEN','OTHER_SESSIONS_CLOSED','PASSWORD_CHANGED','SECURITY_ALERT')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  detail text NOT NULL CHECK (char_length(detail) BETWEEN 2 AND 500),
  auth_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.security_step_up_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_session_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('TRANSFER_CONFIRM')),
  resource_reference text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX security_step_up_grants_lookup_idx ON public.security_step_up_grants(user_id,auth_session_id,action,resource_reference,expires_at DESC);
ALTER TABLE public.security_step_up_grants ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.security_step_up_grants TO service_role;
CREATE INDEX customer_security_sessions_user_seen_idx ON public.customer_security_sessions(user_id,last_seen_at DESC);
CREATE INDEX customer_security_events_user_created_idx ON public.customer_security_events(user_id,created_at DESC);
ALTER TABLE public.customer_security_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_security_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.customer_security_sessions,public.customer_security_events TO authenticated;
GRANT ALL ON public.customer_security_sessions,public.customer_security_events TO service_role;
CREATE POLICY "Customers read own security sessions" ON public.customer_security_sessions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "Customers read own security events" ON public.customer_security_events FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.register_current_security_session(_device_label text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _session_id text := auth.jwt()->>'session_id'; _existing timestamptz;
BEGIN
  IF auth.uid() IS NULL OR _session_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF char_length(trim(coalesce(_device_label,''))) NOT BETWEEN 2 AND 240 THEN RAISE EXCEPTION 'invalid device'; END IF;
  SELECT last_seen_at INTO _existing FROM public.customer_security_sessions WHERE user_id=auth.uid() AND auth_session_id=_session_id;
  INSERT INTO public.customer_security_sessions(user_id,auth_session_id,device_label) VALUES(auth.uid(),_session_id,trim(_device_label)) ON CONFLICT(user_id,auth_session_id) DO UPDATE SET device_label=excluded.device_label,last_seen_at=now(),revoked_at=NULL;
  IF _existing IS NULL THEN
    INSERT INTO public.customer_security_events(user_id,event_type,title,detail,auth_session_id) VALUES(auth.uid(),'SESSION_SEEN','Nouvelle session observée','Une session authentifiée a été enregistrée pour votre compte.',_session_id);
  END IF;
  RETURN _session_id;
END; $$;
CREATE OR REPLACE FUNCTION public.mark_other_security_sessions_revoked()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _session_id text := auth.jwt()->>'session_id'; _count integer;
BEGIN
  IF auth.uid() IS NULL OR _session_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  UPDATE public.customer_security_sessions SET revoked_at=now() WHERE user_id=auth.uid() AND auth_session_id<>_session_id AND revoked_at IS NULL;
  GET DIAGNOSTICS _count=ROW_COUNT;
  INSERT INTO public.customer_security_events(user_id,event_type,title,detail,auth_session_id) VALUES(auth.uid(),'OTHER_SESSIONS_CLOSED','Autres sessions fermées',_count||' autre(s) session(s) ont été marquées comme fermées.',_session_id);
  RETURN _count;
END; $$;
CREATE OR REPLACE FUNCTION public.record_customer_password_changed()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _session_id text := auth.jwt()->>'session_id';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  INSERT INTO public.customer_security_events(user_id,event_type,title,detail,auth_session_id) VALUES(auth.uid(),'PASSWORD_CHANGED','Mot de passe modifié','Le mot de passe de votre compte a été modifié.',_session_id);
  PERFORM public.emit_customer_notification(auth.uid(),'security.password:'||gen_random_uuid(),'SECURITY','WARNING','Mot de passe modifié','Votre mot de passe vient d’être modifié. Si vous n’êtes pas à l’origine de cette action, contactez immédiatement le service client.','/app/security',NULL,'{}');
END; $$;
CREATE OR REPLACE FUNCTION public.issue_security_step_up(_action text,_resource_reference text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _session_id text:=auth.jwt()->>'session_id'; _issued_at timestamptz; _id uuid;
BEGIN
  IF auth.uid() IS NULL OR _session_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF _action<>'TRANSFER_CONFIRM' OR char_length(trim(coalesce(_resource_reference,''))) NOT BETWEEN 5 AND 80 THEN RAISE EXCEPTION 'invalid step up'; END IF;
  _issued_at:=to_timestamp((auth.jwt()->>'iat')::double precision);
  IF _issued_at < now()-interval '5 minutes' THEN RAISE EXCEPTION 'recent authentication required'; END IF;
  INSERT INTO public.security_step_up_grants(user_id,auth_session_id,action,resource_reference,expires_at) VALUES(auth.uid(),_session_id,_action,trim(_resource_reference),now()+interval '5 minutes') RETURNING id INTO _id;
  RETURN _id;
END; $$;
CREATE OR REPLACE FUNCTION public.consume_security_step_up(_action text,_resource_reference text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _id uuid; _session_id text:=auth.jwt()->>'session_id';
BEGIN
  SELECT id INTO _id FROM public.security_step_up_grants WHERE user_id=auth.uid() AND auth_session_id=_session_id AND action=_action AND resource_reference=_resource_reference AND consumed_at IS NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF _id IS NULL THEN RETURN false; END IF;
  UPDATE public.security_step_up_grants SET consumed_at=now() WHERE id=_id;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.register_current_security_session(text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.mark_other_security_sessions_revoked() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.record_customer_password_changed() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.register_current_security_session(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_other_security_sessions_revoked() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_customer_password_changed() TO authenticated;
REVOKE ALL ON FUNCTION public.issue_security_step_up(text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.consume_security_step_up(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.issue_security_step_up(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_security_step_up(text,text) TO authenticated;
COMMENT ON TABLE public.customer_security_sessions IS 'Application-level view of observed Supabase auth sessions; authoritative revocation remains Supabase Auth.';
COMMENT ON TABLE public.customer_security_events IS 'Append-only customer-visible security history; browser roles have no insert, update or delete grants.';