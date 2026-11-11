-- Harden pending phone changes and OTP lifecycle.
CREATE OR REPLACE FUNCTION public.customer_change_pending_phone(
  _user_id uuid,
  _phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile public.profiles;
BEGIN
  IF _phone IS NULL OR _phone !~ '^\\+[1-9][0-9]{7,14}$' THEN
    RAISE EXCEPTION 'INVALID_PHONE';
  END IF;

  SELECT * INTO _profile
    FROM public.profiles
   WHERE id = _user_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND'; END IF;
  IF _profile.lifecycle_state NOT IN (
    'CONTACT_VERIFICATION_REQUIRED','PROFILE_INCOMPLETE',
    'IDENTITY_REQUIRED','ADDITIONAL_DOCUMENT_REQUIRED'
  ) THEN
    RAISE EXCEPTION 'ONBOARDING_STATE_LOCKED';
  END IF;
  IF _profile.phone = _phone THEN RAISE EXCEPTION 'PHONE_UNCHANGED'; END IF;

  UPDATE public.phone_verification_codes
     SET consumed_at = now()
   WHERE user_id = _user_id AND consumed_at IS NULL;

  UPDATE public.profiles
     SET phone = _phone,
         phone_verified_at = NULL,
         lifecycle_state = 'CONTACT_VERIFICATION_REQUIRED',
         onboarding_step = 'CONTACT'
   WHERE id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.customer_create_phone_verification(
  _user_id uuid,
  _code_hash text,
  _code text,
  _expires_at timestamptz
)
RETURNS TABLE(notification_id uuid, phone text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile public.profiles;
  _last_created timestamptz;
  _notification_id uuid;
BEGIN
  SELECT * INTO _profile
    FROM public.profiles
   WHERE id = _user_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND'; END IF;
  IF _profile.phone IS NULL OR _profile.phone = '' THEN RAISE EXCEPTION 'PHONE_REQUIRED'; END IF;
  IF _profile.phone_verified_at IS NOT NULL THEN RAISE EXCEPTION 'PHONE_ALREADY_VERIFIED'; END IF;
  IF _profile.lifecycle_state <> 'CONTACT_VERIFICATION_REQUIRED' THEN
    RAISE EXCEPTION 'ONBOARDING_STATE_LOCKED';
  END IF;

  SELECT created_at INTO _last_created
    FROM public.phone_verification_codes
   WHERE user_id = _user_id
   ORDER BY created_at DESC
   LIMIT 1;

  IF _last_created IS NOT NULL AND _last_created > now() - interval '60 seconds' THEN
    RAISE EXCEPTION 'OTP_COOLDOWN';
  END IF;

  UPDATE public.phone_verification_codes
     SET consumed_at = now()
   WHERE user_id = _user_id AND consumed_at IS NULL;

  INSERT INTO public.phone_verification_codes (
    user_id, phone, code_hash, expires_at, attempts
  ) VALUES (
    _user_id, _profile.phone, _code_hash, _expires_at, 0
  );

  INSERT INTO public.notification_outbox (
    user_id, channel, recipient, template_key, payload, status
  ) VALUES (
    _user_id, 'SMS', _profile.phone, 'CONTACT_VERIFICATION_CODE',
    jsonb_build_object('code', _code, 'expires_in_minutes', 10), 'PENDING'
  ) RETURNING id INTO _notification_id;

  RETURN QUERY SELECT _notification_id, _profile.phone, _expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.customer_verify_phone_code(
  _user_id uuid,
  _phone text,
  _code_hash text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile public.profiles;
  _challenge public.phone_verification_codes;
  _verified_at timestamptz := now();
BEGIN
  SELECT * INTO _profile
    FROM public.profiles
   WHERE id = _user_id
   FOR UPDATE;

  IF NOT FOUND THEN RETURN 'CUSTOMER_PROFILE_NOT_FOUND'; END IF;
  IF _profile.phone IS DISTINCT FROM _phone THEN RETURN 'PHONE_CHANGED'; END IF;
  IF _profile.phone_verified_at IS NOT NULL THEN RETURN 'ALREADY_VERIFIED'; END IF;

  SELECT * INTO _challenge
    FROM public.phone_verification_codes
   WHERE user_id = _user_id
     AND phone = _profile.phone
     AND consumed_at IS NULL
   ORDER BY created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND THEN RETURN 'OTP_NOT_FOUND'; END IF;
  IF _challenge.expires_at <= _verified_at THEN
    UPDATE public.phone_verification_codes SET consumed_at = _verified_at WHERE id = _challenge.id;
    RETURN 'OTP_EXPIRED';
  END IF;
  IF _challenge.attempts >= 5 THEN RETURN 'OTP_LOCKED'; END IF;

  IF _challenge.code_hash <> _code_hash THEN
    UPDATE public.phone_verification_codes
       SET attempts = LEAST(attempts + 1, 5)
     WHERE id = _challenge.id;
    RETURN CASE WHEN _challenge.attempts + 1 >= 5 THEN 'OTP_LOCKED' ELSE 'OTP_INVALID' END;
  END IF;

  UPDATE public.phone_verification_codes
     SET consumed_at = _verified_at
   WHERE id = _challenge.id AND consumed_at IS NULL;

  UPDATE public.profiles
     SET phone_verified_at = _verified_at,
         lifecycle_state = 'PROFILE_INCOMPLETE',
         onboarding_step = CASE
           WHEN onboarding_step IN ('CONTACT','PERSONAL_DETAILS','NOT_STARTED') THEN 'ADDRESS'
           ELSE onboarding_step
         END
   WHERE id = _user_id
     AND phone = _phone
     AND phone_verified_at IS NULL;

  IF NOT FOUND THEN RETURN 'PHONE_CHANGED'; END IF;
  RETURN 'OK';
END;
$$;

REVOKE ALL ON FUNCTION public.customer_change_pending_phone(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.customer_create_phone_verification(uuid, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.customer_verify_phone_code(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_change_pending_phone(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.customer_create_phone_verification(uuid, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.customer_verify_phone_code(uuid, text, text) TO service_role;
