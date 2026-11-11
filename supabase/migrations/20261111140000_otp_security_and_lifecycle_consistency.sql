-- OTP hardening: preserve lifecycle progression, cap SMS requests, encrypt OTP payloads,
-- and distinguish provider acceptance from handset delivery.
BEGIN;

ALTER TABLE public.notification_outbox
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

UPDATE public.notification_outbox
   SET claimed_at = processed_at
 WHERE status = 'PROCESSING'
   AND claimed_at IS NULL
   AND processed_at IS NOT NULL;

ALTER TABLE public.notification_outbox
  DROP CONSTRAINT IF EXISTS notification_outbox_status_check;

ALTER TABLE public.notification_outbox
  ADD CONSTRAINT notification_outbox_status_check
  CHECK (status IN ('PENDING', 'PROCESSING', 'ACCEPTED', 'SENT', 'SIMULATED', 'FAILED'));

-- Replace the plaintext-code RPC argument with an authenticated-encrypted payload.
DROP FUNCTION IF EXISTS public.customer_create_phone_verification(uuid, text, text, timestamptz);

CREATE OR REPLACE FUNCTION public.customer_create_phone_verification(
  _user_id uuid,
  _code_hash text,
  _payload jsonb,
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
  _user_daily_count integer;
  _phone_daily_count integer;
  _notification_id uuid;
BEGIN
  SELECT * INTO _profile
    FROM public.profiles
   WHERE id = _user_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND'; END IF;
  IF _profile.phone IS NULL OR _profile.phone = '' THEN RAISE EXCEPTION 'PHONE_REQUIRED'; END IF;
  IF _profile.phone_verified_at IS NOT NULL THEN RAISE EXCEPTION 'PHONE_ALREADY_VERIFIED'; END IF;
  IF _profile.lifecycle_state NOT IN (
    'CONTACT_VERIFICATION_REQUIRED','PROFILE_INCOMPLETE',
    'IDENTITY_REQUIRED','ADDITIONAL_DOCUMENT_REQUIRED'
  ) THEN
    RAISE EXCEPTION 'ONBOARDING_STATE_LOCKED';
  END IF;
  IF _payload IS NULL OR _payload->>'v' <> '1'
     OR _payload->>'iv' IS NULL OR _payload->>'tag' IS NULL
     OR _payload->>'ciphertext' IS NULL THEN
    RAISE EXCEPTION 'OTP_PAYLOAD_INVALID';
  END IF;
  IF _expires_at <= now() OR _expires_at > now() + interval '11 minutes' THEN
    RAISE EXCEPTION 'OTP_EXPIRY_INVALID';
  END IF;

  -- Serialize requests targeting the same normalized E.164 number, even across accounts.
  PERFORM pg_advisory_xact_lock(hashtextextended(_profile.phone, 0));

  SELECT created_at INTO _last_created
    FROM public.phone_verification_codes
   WHERE user_id = _user_id
   ORDER BY created_at DESC
   LIMIT 1;

  IF _last_created IS NOT NULL AND _last_created > now() - interval '60 seconds' THEN
    RAISE EXCEPTION 'OTP_COOLDOWN';
  END IF;

  SELECT count(*) INTO _user_daily_count
    FROM public.phone_verification_codes
   WHERE user_id = _user_id
     AND created_at >= now() - interval '24 hours';
  IF _user_daily_count >= 5 THEN RAISE EXCEPTION 'OTP_USER_DAILY_LIMIT'; END IF;

  SELECT count(*) INTO _phone_daily_count
    FROM public.phone_verification_codes
   WHERE phone = _profile.phone
     AND created_at >= now() - interval '24 hours';
  IF _phone_daily_count >= 3 THEN RAISE EXCEPTION 'OTP_PHONE_DAILY_LIMIT'; END IF;

  UPDATE public.phone_verification_codes
     SET consumed_at = now()
   WHERE user_id = _user_id AND consumed_at IS NULL;

  UPDATE public.notification_outbox
     SET status = 'FAILED', processed_at = now(), last_error_code = 'OTP_SUPERSEDED'
   WHERE user_id = _user_id AND channel = 'SMS'
     AND template_key = 'CONTACT_VERIFICATION_CODE'
     AND status IN ('PENDING','PROCESSING');

  INSERT INTO public.phone_verification_codes (
    user_id, phone, code_hash, expires_at, attempts
  ) VALUES (
    _user_id, _profile.phone, _code_hash, _expires_at, 0
  );

  INSERT INTO public.notification_outbox (
    user_id, channel, recipient, template_key, payload, status
  ) VALUES (
    _user_id, 'SMS', _profile.phone, 'CONTACT_VERIFICATION_CODE', _payload, 'PENDING'
  ) RETURNING id INTO _notification_id;

  RETURN QUERY SELECT _notification_id, _profile.phone, _expires_at;
END;
$$;

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

  UPDATE public.notification_outbox
     SET status = 'FAILED', processed_at = now(), last_error_code = 'OTP_SUPERSEDED'
   WHERE user_id = _user_id AND channel = 'SMS'
     AND template_key = 'CONTACT_VERIFICATION_CODE'
     AND status IN ('PENDING','PROCESSING');

  -- Preserve the current lifecycle state and later onboarding step.
  UPDATE public.profiles
     SET phone = _phone,
         phone_verified_at = NULL,
         onboarding_step = CASE
           WHEN onboarding_step IN ('NOT_STARTED','CONTACT','PERSONAL_DETAILS') THEN 'CONTACT'
           ELSE onboarding_step
         END
   WHERE id = _user_id;
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
  IF _profile.lifecycle_state NOT IN (
    'CONTACT_VERIFICATION_REQUIRED','PROFILE_INCOMPLETE',
    'IDENTITY_REQUIRED','ADDITIONAL_DOCUMENT_REQUIRED'
  ) THEN RETURN 'ONBOARDING_STATE_LOCKED'; END IF;

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
         lifecycle_state = CASE
           WHEN lifecycle_state = 'CONTACT_VERIFICATION_REQUIRED' THEN 'PROFILE_INCOMPLETE'::public.customer_lifecycle_state
           ELSE lifecycle_state
         END,
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

CREATE OR REPLACE FUNCTION public.claim_pending_sms_notifications(_user_id uuid)
RETURNS TABLE(id uuid, recipient text, template_key text, payload jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notification_outbox
     SET status = 'FAILED',
         last_error_code = 'SMS_DISPATCH_TIMEOUT',
         processed_at = now(),
         claimed_at = NULL
   WHERE user_id = _user_id
     AND channel = 'SMS'
     AND status = 'PROCESSING'
     AND claimed_at < now() - interval '2 minutes';

  RETURN QUERY
  WITH candidates AS (
    SELECT o.id
      FROM public.notification_outbox AS o
     WHERE o.user_id = _user_id
       AND o.channel = 'SMS'
       AND o.template_key = 'CONTACT_VERIFICATION_CODE'
       AND o.status = 'PENDING'
     ORDER BY o.created_at, o.id
     LIMIT 20
     FOR UPDATE SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.notification_outbox AS o
       SET status = 'PROCESSING',
           attempts = attempts + 1,
           claimed_at = now()
      FROM candidates AS c
     WHERE o.id = c.id
       AND o.status = 'PENDING'
    RETURNING o.id, o.recipient, o.template_key, o.payload
  )
  SELECT claimed.id, claimed.recipient, claimed.template_key, claimed.payload
    FROM claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.customer_change_pending_phone(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.customer_create_phone_verification(uuid, text, jsonb, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.customer_verify_phone_code(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_pending_sms_notifications(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_change_pending_phone(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.customer_create_phone_verification(uuid, text, jsonb, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.customer_verify_phone_code(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_pending_sms_notifications(uuid) TO service_role;

COMMIT;
