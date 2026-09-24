-- STEP 5 — Customer-to-support messaging only. No customer-to-customer chat.
INSERT INTO public.role_permissions(role,permission) VALUES
  ('support_agent','support.read'),
  ('support_agent','support.reply'),
  ('supervisor','support.read'),
  ('supervisor','support.reply'),
  ('administrator','support.read'),
  ('administrator','support.reply'),
  ('super_admin','support.read'),
  ('super_admin','support.reply')
ON CONFLICT DO NOTHING;

CREATE TABLE public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference text NOT NULL UNIQUE DEFAULT
    ('SUP-' || to_char(now(),'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
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

CREATE POLICY "Customers read own support threads" ON public.support_threads
  FOR SELECT TO authenticated USING (
    customer_user_id=auth.uid() OR public.has_permission(auth.uid(),'support.read')
  );
CREATE POLICY "Customers read own support messages" ON public.support_messages
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.support_threads t WHERE t.id=thread_id
      AND (t.customer_user_id=auth.uid() OR public.has_permission(auth.uid(),'support.read'))
  ));

CREATE OR REPLACE FUNCTION public.create_support_thread(_subject text,_category text,_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _thread_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF char_length(trim(coalesce(_subject,''))) NOT BETWEEN 5 AND 120 THEN RAISE EXCEPTION 'invalid subject'; END IF;
  IF _category NOT IN ('ACCOUNT','TRANSFER','DOCUMENT','SECURITY','OTHER') THEN RAISE EXCEPTION 'invalid category'; END IF;
  IF char_length(trim(coalesce(_body,''))) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'invalid message'; END IF;
  INSERT INTO public.support_threads(customer_user_id,subject,category,status)
  VALUES(auth.uid(),trim(_subject),_category,'WAITING_SUPPORT') RETURNING id INTO _thread_id;
  INSERT INTO public.support_messages(thread_id,author_user_id,author_kind,body)
  VALUES(_thread_id,auth.uid(),'CUSTOMER',trim(_body));
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
  INSERT INTO public.support_messages(thread_id,author_user_id,author_kind,body)
  VALUES(_thread.id,auth.uid(),'CUSTOMER',trim(_body)) RETURNING id INTO _message_id;
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
  INSERT INTO public.support_messages(thread_id,author_user_id,author_kind,body)
  VALUES(_thread.id,auth.uid(),'STAFF',trim(_body)) RETURNING id INTO _message_id;
  UPDATE public.support_threads SET status='WAITING_CUSTOMER',assigned_staff_id=coalesce(assigned_staff_id,auth.uid()),last_message_at=now(),updated_at=now() WHERE id=_thread.id;
  PERFORM public.emit_customer_notification(_thread.customer_user_id,'support.reply:'||_message_id,'SERVICE','INFO','Nouvelle réponse du service client','Le service client a répondu à votre demande.','/app/messages',NULL,jsonb_build_object('threadId',_thread.id));
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
  VALUES(auth.uid(),'support.replied','support_thread',_thread.public_reference,'support.reply','ALLOWED',jsonb_build_object('message_id',_message_id));
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
  INSERT INTO public.admin_audit_events(actor_user_id,action,resource_type,resource_reference,permission_checked,result,context)
  VALUES(auth.uid(),'support.status_changed','support_thread',_thread.public_reference,'support.reply','ALLOWED',jsonb_build_object('previous',_thread.status,'new',_status));
END; $$;

REVOKE ALL ON FUNCTION public.create_support_thread(text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.reply_support_thread(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.staff_reply_support_thread(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.staff_set_support_status(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_support_thread(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reply_support_thread(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_reply_support_thread(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_set_support_status(uuid,text) TO authenticated;
