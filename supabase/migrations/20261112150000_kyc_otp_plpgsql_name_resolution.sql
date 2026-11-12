-- Repair KYC review metadata and qualify PL/pgSQL output-column collisions.
-- This forward-only migration is safe for databases that have already applied
-- the preceding onboarding and OTP migrations.

BEGIN;

ALTER TABLE public.verification_documents
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

COMMENT ON COLUMN public.verification_documents.reviewed_at IS
  'Timestamp when a compliance reviewer accepted or rejected the document.';

CREATE OR REPLACE FUNCTION public.customer_submit_onboarding_for_verification(
  _user_id uuid
)
RETURNS TABLE(status public.identity_verification_status, already_submitted boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile public.profiles;
  _verification public.identity_verifications;
  _has_identity boolean;
  _has_address_proof boolean;
  _submitted_at timestamptz := now();
BEGIN
  SELECT * INTO _profile
    FROM public.profiles
   WHERE id = _user_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND'; END IF;

  INSERT INTO public.identity_verifications (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO _verification
    FROM public.identity_verifications
   WHERE user_id = _user_id
   FOR UPDATE;

  IF _verification.status IN ('SUBMITTED','UNDER_REVIEW','VERIFIED') THEN
    RETURN QUERY SELECT _verification.status, true;
    RETURN;
  END IF;

  IF _profile.lifecycle_state NOT IN (
    'CONTACT_VERIFICATION_REQUIRED','PROFILE_INCOMPLETE','IDENTITY_REQUIRED','ADDITIONAL_DOCUMENT_REQUIRED'
  ) THEN
    RAISE EXCEPTION 'ONBOARDING_STATE_LOCKED';
  END IF;

  IF _profile.phone IS NULL OR _profile.phone_verified_at IS NULL THEN
    RAISE EXCEPTION 'PHONE_VERIFICATION_REQUIRED';
  END IF;

  IF NULLIF(btrim(_profile.first_name), '') IS NULL
     OR NULLIF(btrim(_profile.last_name), '') IS NULL
     OR _profile.date_of_birth IS NULL
     OR NULLIF(btrim(_profile.nationality), '') IS NULL
     OR NULLIF(btrim(_profile.country_of_residence), '') IS NULL
     OR NULLIF(btrim(_profile.occupation), '') IS NULL THEN
    RAISE EXCEPTION 'PROFILE_INCOMPLETE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.customer_addresses AS ca
     WHERE ca.user_id = _user_id AND ca.is_primary = true
  ) THEN
    RAISE EXCEPTION 'ADDRESS_REQUIRED';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.verification_documents AS vd
     WHERE vd.verification_id = _verification.id
       AND vd.user_id = _user_id
       AND vd.document_type IN ('IDENTITY_CARD','PASSPORT','RESIDENCE_PERMIT')
       AND vd.status = 'UPLOADED'
  ) INTO _has_identity;

  SELECT EXISTS (
    SELECT 1 FROM public.verification_documents AS vd
     WHERE vd.verification_id = _verification.id
       AND vd.user_id = _user_id
       AND vd.document_type = 'PROOF_OF_ADDRESS'
       AND vd.status = 'UPLOADED'
  ) INTO _has_address_proof;

  -- Skipping is allowed only during initial registration. If Compliance has
  -- explicitly requested additional information, the customer must provide it.
  IF NOT _has_identity OR NOT _has_address_proof THEN
    IF _profile.lifecycle_state = 'ADDITIONAL_DOCUMENT_REQUIRED' THEN
      IF NOT _has_identity THEN RAISE EXCEPTION 'IDENTITY_DOCUMENT_REQUIRED'; END IF;
      IF NOT _has_address_proof THEN RAISE EXCEPTION 'PROOF_OF_ADDRESS_REQUIRED'; END IF;
    END IF;

    UPDATE public.profiles
       SET lifecycle_state = 'IDENTITY_REQUIRED',
           onboarding_step = 'COMPLETED'
     WHERE id = _user_id;

    RETURN QUERY SELECT _verification.status, false;
    RETURN;
  END IF;

  UPDATE public.identity_verifications
     SET status = 'SUBMITTED',
         submitted_at = _submitted_at,
         requested_information = NULL,
         decision_reason = NULL
   WHERE id = _verification.id;

  INSERT INTO public.verification_status_history (
    verification_id, user_id, previous_status, new_status, changed_by, note
  ) VALUES (
    _verification.id, _user_id, _verification.status, 'SUBMITTED',
    _user_id, 'Dossier envoyé par le client.'
  );

  UPDATE public.verification_documents AS vd
     SET status = 'UNDER_REVIEW'
   WHERE vd.verification_id = _verification.id
     AND vd.user_id = _user_id
     AND vd.status = 'UPLOADED';

  UPDATE public.profiles
     SET lifecycle_state = 'IDENTITY_SUBMITTED',
         onboarding_step = 'COMPLETED'
   WHERE id = _user_id;

  RETURN QUERY SELECT 'SUBMITTED'::public.identity_verification_status, false;
END;
$$;

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

  SELECT pvc.created_at INTO _last_created
    FROM public.phone_verification_codes AS pvc
   WHERE pvc.user_id = _user_id
   ORDER BY pvc.created_at DESC
   LIMIT 1;

  IF _last_created IS NOT NULL AND _last_created > now() - interval '60 seconds' THEN
    RAISE EXCEPTION 'OTP_COOLDOWN';
  END IF;

  SELECT count(*) INTO _user_daily_count
    FROM public.phone_verification_codes AS pvc
   WHERE pvc.user_id = _user_id
     AND pvc.created_at >= now() - interval '24 hours';
  IF _user_daily_count >= 5 THEN RAISE EXCEPTION 'OTP_USER_DAILY_LIMIT'; END IF;

  SELECT count(*) INTO _phone_daily_count
    FROM public.phone_verification_codes AS pvc
   WHERE pvc.phone = _profile.phone
     AND pvc.created_at >= now() - interval '24 hours';
  IF _phone_daily_count >= 3 THEN RAISE EXCEPTION 'OTP_PHONE_DAILY_LIMIT'; END IF;

  UPDATE public.phone_verification_codes AS pvc
     SET consumed_at = now()
   WHERE pvc.user_id = _user_id AND pvc.consumed_at IS NULL;

  UPDATE public.notification_outbox AS no
     SET status = 'FAILED',
         processed_at = now(),
         claimed_at = NULL,
         payload = '{}'::jsonb,
         last_error_code = 'OTP_SUPERSEDED'
   WHERE no.user_id = _user_id
     AND no.channel = 'SMS'
     AND no.template_key = 'CONTACT_VERIFICATION_CODE'
     AND no.status IN ('PENDING','PROCESSING');

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

REVOKE ALL ON FUNCTION public.customer_submit_onboarding_for_verification(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_submit_onboarding_for_verification(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.customer_create_phone_verification(uuid, text, jsonb, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_create_phone_verification(uuid, text, jsonb, timestamptz)
  TO service_role;

COMMIT;
