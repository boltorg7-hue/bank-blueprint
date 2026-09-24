-- STEP 6 — Minimal customer security centre and immutable security history.
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
  INSERT INTO public.customer_security_sessions(user_id,auth_session_id,device_label)
  VALUES(auth.uid(),_session_id,trim(_device_label))
  ON CONFLICT(user_id,auth_session_id) DO UPDATE SET device_label=excluded.device_label,last_seen_at=now(),revoked_at=NULL;
  IF _existing IS NULL THEN
    INSERT INTO public.customer_security_events(user_id,event_type,title,detail,auth_session_id)
    VALUES(auth.uid(),'SESSION_SEEN','Nouvelle session observée','Une session authentifiée a été enregistrée pour votre compte.',_session_id);
  END IF;
  RETURN _session_id;
END; $$;

CREATE OR REPLACE FUNCTION public.mark_other_security_sessions_revoked()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _session_id text := auth.jwt()->>'session_id'; _count integer;
BEGIN
  IF auth.uid() IS NULL OR _session_id IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  UPDATE public.customer_security_sessions SET revoked_at=now()
  WHERE user_id=auth.uid() AND auth_session_id<>_session_id AND revoked_at IS NULL;
  GET DIAGNOSTICS _count=ROW_COUNT;
  INSERT INTO public.customer_security_events(user_id,event_type,title,detail,auth_session_id)
  VALUES(auth.uid(),'OTHER_SESSIONS_CLOSED','Autres sessions fermées',_count||' autre(s) session(s) ont été marquées comme fermées.',_session_id);
  RETURN _count;
END; $$;

CREATE OR REPLACE FUNCTION public.record_customer_password_changed()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _session_id text := auth.jwt()->>'session_id';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  INSERT INTO public.customer_security_events(user_id,event_type,title,detail,auth_session_id)
  VALUES(auth.uid(),'PASSWORD_CHANGED','Mot de passe modifié','Le mot de passe de votre compte a été modifié.',_session_id);
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
  INSERT INTO public.security_step_up_grants(user_id,auth_session_id,action,resource_reference,expires_at)
  VALUES(auth.uid(),_session_id,_action,trim(_resource_reference),now()+interval '5 minutes') RETURNING id INTO _id;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.consume_security_step_up(_action text,_resource_reference text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _id uuid; _session_id text:=auth.jwt()->>'session_id';
BEGIN
  SELECT id INTO _id FROM public.security_step_up_grants
  WHERE user_id=auth.uid() AND auth_session_id=_session_id AND action=_action
    AND resource_reference=_resource_reference AND consumed_at IS NULL AND expires_at>now()
  ORDER BY created_at DESC LIMIT 1 FOR UPDATE SKIP LOCKED;
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
