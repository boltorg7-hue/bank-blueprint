CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('ACCOUNT','FUNDING','TRANSFER','SECURITY','SERVICE','PRICING')),
  severity text NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','SUCCESS','WARNING','CRITICAL')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 2 AND 500),
  resource_path text,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE(read_at, archived_at) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "customers update own notification state" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.emit_customer_notification(_user_id uuid,_event_key text,_category text,_severity text,_title text,_body text,_resource_path text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  INSERT INTO public.notifications(user_id,event_key,category,severity,title,body,resource_path)
  VALUES (_user_id,_event_key,_category,_severity,_title,_body,_resource_path) ON CONFLICT(event_key) DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.notify_account_events() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    PERFORM public.emit_customer_notification(NEW.user_id,'account.opened:'||NEW.id,'ACCOUNT','SUCCESS','Compte bancaire créé','Votre compte '||NEW.public_reference||' est disponible.','/app/accounts');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.emit_customer_notification(NEW.user_id,'account.status:'||NEW.id||':'||extract(epoch from now()),'ACCOUNT',
      CASE WHEN NEW.status::text IN ('ACTIVE') THEN 'SUCCESS' ELSE 'WARNING' END,
      'Statut du compte modifié','Le statut de votre compte '||NEW.public_reference||' est désormais : '||NEW.status::text||'.','/app/accounts');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER bank_account_notifications AFTER INSERT OR UPDATE OF status ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.notify_account_events();

CREATE OR REPLACE FUNCTION public.notify_funding_approved() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid;
BEGIN
  IF NEW.status='APPROVED' AND OLD.status IS DISTINCT FROM 'APPROVED' THEN
    SELECT user_id INTO _uid FROM public.bank_accounts WHERE id=NEW.account_id;
    PERFORM public.emit_customer_notification(_uid,'funding.approved:'||NEW.id,'FUNDING','SUCCESS','Compte crédité',
      'Un approvisionnement de '||to_char(NEW.amount_minor/100.0,'FM999G999G990D00')||' '||NEW.currency||' a été approuvé et crédité.','/app/activity');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER funding_approved_notification AFTER UPDATE OF status ON public.funding_requests FOR EACH ROW EXECUTE FUNCTION public.notify_funding_approved();

CREATE OR REPLACE FUNCTION public.notify_transfer_events() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _recipient uuid; _amt text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  _amt := to_char(NEW.amount_minor/100.0,'FM999G999G990D00')||' '||NEW.currency;
  IF NEW.status='COMPLETED' THEN
    PERFORM public.emit_customer_notification(NEW.sender_user_id,'transfer.sent:'||NEW.id,'TRANSFER','SUCCESS','Virement exécuté','Votre virement '||NEW.public_reference||' de '||_amt||' a été exécuté.','/app/transfers/'||NEW.public_reference);
    SELECT user_id INTO _recipient FROM public.bank_accounts WHERE id=NEW.destination_account_id;
    IF _recipient IS NOT NULL AND _recipient<>NEW.sender_user_id THEN
      PERFORM public.emit_customer_notification(_recipient,'transfer.received:'||NEW.id,'TRANSFER','SUCCESS','Virement reçu','Vous avez reçu '||_amt||'.','/app/activity');
    END IF;
  ELSIF NEW.status IN ('FAILED','REJECTED') THEN
    PERFORM public.emit_customer_notification(NEW.sender_user_id,'transfer.failed:'||NEW.id,'TRANSFER','WARNING','Virement non exécuté','Votre virement '||NEW.public_reference||' n''a pas pu être exécuté. Les fonds réservés ont été libérés.','/app/transfers/'||NEW.public_reference);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER transfer_notifications AFTER UPDATE OF status ON public.transfers FOR EACH ROW EXECUTE FUNCTION public.notify_transfer_events();

CREATE OR REPLACE FUNCTION public.notify_pricing_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _label text; _val text;
BEGIN
  IF NEW.version <= 1 THEN RETURN NEW; END IF;
  _label := CASE NEW.setting_key WHEN 'USD_PER_USDT' THEN 'Parité USD/USDT'
    WHEN 'ACCOUNT_MAINTENANCE_MONTHLY' THEN 'Tenue de compte mensuelle'
    WHEN 'TRANSFER_INTERNAL' THEN 'Frais de virement interne'
    WHEN 'TRANSFER_EXTERNAL' THEN 'Frais de virement externe' ELSE NEW.setting_key END;
  _val := CASE WHEN NEW.setting_key='USD_PER_USDT' THEN '1 USDT = '||NEW.numeric_value::text||' USD'
    ELSE to_char(NEW.numeric_value/100.0,'FM999G990D00')||' USD' END;
  INSERT INTO public.notifications(user_id,event_key,category,severity,title,body,resource_path)
  SELECT DISTINCT b.user_id,'pricing:'||NEW.id||':'||b.user_id,'PRICING','INFO',_label||' mis à jour','Nouvelle valeur : '||_val||'.','/pricing'
  FROM public.bank_accounts b ON CONFLICT(event_key) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER pricing_change_notification AFTER INSERT ON public.financial_setting_versions FOR EACH ROW EXECUTE FUNCTION public.notify_pricing_change();

REVOKE ALL ON FUNCTION public.emit_customer_notification(uuid,text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.notify_account_events() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.notify_funding_approved() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.notify_transfer_events() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.notify_pricing_change() FROM PUBLIC,anon,authenticated;