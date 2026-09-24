-- STEP 3 — Trusted in-app notifications and SMS delivery outbox.
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('ACCOUNT','FUNDING','TRANSFER','SECURITY','SERVICE')),
  severity text NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','SUCCESS','WARNING','CRITICAL')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 2 AND 500),
  resource_path text,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_created_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL AND archived_at IS NULL;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE(read_at, archived_at) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "customers update own notification state" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('SMS','EMAIL')),
  recipient text NOT NULL,
  template_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SIMULATED','SENT','FAILED','CANCELLED')),
  provider_reference text,
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(notification_id, channel)
);
CREATE INDEX notification_outbox_pending_idx ON public.notification_outbox(status, available_at) WHERE status IN ('PENDING','FAILED');
GRANT ALL ON public.notification_outbox TO service_role;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.emit_customer_notification(
  _user_id uuid, _event_key text, _category text, _severity text,
  _title text, _body text, _resource_path text, _sms_template text, _payload jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _notification_id uuid; _phone text; _sms_enabled boolean := true;
BEGIN
  INSERT INTO public.notifications(user_id,event_key,category,severity,title,body,resource_path)
  VALUES (_user_id,_event_key,_category,_severity,_title,_body,_resource_path)
  ON CONFLICT(event_key) DO NOTHING RETURNING id INTO _notification_id;
  IF _notification_id IS NULL THEN SELECT id INTO _notification_id FROM public.notifications WHERE event_key = _event_key; RETURN _notification_id; END IF;
  IF _sms_template IS NOT NULL THEN
    SELECT p.phone, COALESCE(cp.sms_transactions,true) INTO _phone,_sms_enabled FROM public.profiles p LEFT JOIN public.customer_preferences cp ON cp.user_id=p.id WHERE p.id=_user_id;
    IF _phone IS NOT NULL AND _sms_enabled THEN
      INSERT INTO public.notification_outbox(notification_id,user_id,channel,recipient,template_key,payload)
      VALUES (_notification_id,_user_id,'SMS',_phone,_sms_template,COALESCE(_payload,'{}'::jsonb)) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN _notification_id;
END; $$;
REVOKE ALL ON FUNCTION public.emit_customer_notification(uuid,text,text,text,text,text,text,text,jsonb) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.notify_account_opened() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public.emit_customer_notification(NEW.user_id,'account.opened:'||NEW.id,'ACCOUNT','SUCCESS','Compte bancaire créé','Votre compte '||NEW.public_reference||' est maintenant disponible.','/app/accounts/'||NEW.public_reference,'ACCOUNT_OPENED',jsonb_build_object('accountReference',NEW.public_reference));
  RETURN NEW;
END; $$;
CREATE TRIGGER bank_account_notification AFTER INSERT ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.notify_account_opened();

CREATE OR REPLACE FUNCTION public.notify_funding_approved() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _account public.bank_accounts%ROWTYPE;
BEGIN
  IF NEW.status='APPROVED' AND OLD.status IS DISTINCT FROM 'APPROVED' THEN
    SELECT * INTO _account FROM public.bank_accounts WHERE id=NEW.account_id;
    PERFORM public.emit_customer_notification(_account.user_id,'funding.approved:'||NEW.id,'FUNDING','SUCCESS','Compte crédité','Un approvisionnement a été ajouté à votre compte.','/app/accounts/'||_account.public_reference,'FUNDING_RECEIVED',jsonb_build_object('amountMinor',NEW.amount_minor,'currency',NEW.currency,'accountReference',_account.public_reference));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER funding_approved_notification AFTER UPDATE OF status ON public.funding_requests FOR EACH ROW EXECUTE FUNCTION public.notify_funding_approved();

CREATE OR REPLACE FUNCTION public.notify_internal_transfer_completed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _recipient uuid;
BEGIN
  IF NEW.transfer_kind='INTERNAL_TRANSFER' AND NEW.status='COMPLETED' AND OLD.status IS DISTINCT FROM 'COMPLETED' THEN
    PERFORM public.emit_customer_notification(NEW.sender_user_id,'transfer.sent:'||NEW.id,'TRANSFER','SUCCESS','Virement envoyé','Votre virement interne a été exécuté.','/app/transfers/'||NEW.public_reference,'TRANSFER_SENT',jsonb_build_object('amountMinor',NEW.amount_minor,'currency',NEW.currency,'reference',NEW.public_reference));
    SELECT user_id INTO _recipient FROM public.bank_accounts WHERE id=NEW.destination_account_id;
    IF _recipient IS NOT NULL THEN PERFORM public.emit_customer_notification(_recipient,'transfer.received:'||NEW.id,'TRANSFER','SUCCESS','Virement reçu','Vous avez reçu un virement interne.','/app/activity','TRANSFER_RECEIVED',jsonb_build_object('amountMinor',NEW.amount_minor,'currency',NEW.currency,'reference',NEW.public_reference)); END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER internal_transfer_notification AFTER UPDATE OF status ON public.transfers FOR EACH ROW EXECUTE FUNCTION public.notify_internal_transfer_completed();

REVOKE ALL ON FUNCTION public.notify_account_opened() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.notify_funding_approved() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.notify_internal_transfer_completed() FROM PUBLIC,anon,authenticated;
