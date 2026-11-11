-- Allow customers to finish initial registration without uploading KYC documents.
-- Missing documents keep the customer in IDENTITY_REQUIRED; they do not submit
-- an identity verification or grant banking access. Additional KYC requests remain mandatory.

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
    SELECT 1 FROM public.customer_addresses
     WHERE user_id = _user_id AND is_primary = true
  ) THEN
    RAISE EXCEPTION 'ADDRESS_REQUIRED';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.verification_documents
     WHERE verification_id = _verification.id
       AND user_id = _user_id
       AND document_type IN ('IDENTITY_CARD','PASSPORT','RESIDENCE_PERMIT')
       AND status = 'UPLOADED'
  ) INTO _has_identity;

  SELECT EXISTS (
    SELECT 1 FROM public.verification_documents
     WHERE verification_id = _verification.id
       AND user_id = _user_id
       AND document_type = 'PROOF_OF_ADDRESS'
       AND status = 'UPLOADED'
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

  UPDATE public.verification_documents
     SET status = 'UNDER_REVIEW'
   WHERE verification_id = _verification.id
     AND user_id = _user_id
     AND status = 'UPLOADED';

  UPDATE public.profiles
     SET lifecycle_state = 'IDENTITY_SUBMITTED',
         onboarding_step = 'COMPLETED'
   WHERE id = _user_id;

  RETURN QUERY SELECT 'SUBMITTED'::public.identity_verification_status, false;
END;
$$;

REVOKE ALL ON FUNCTION public.customer_submit_onboarding_for_verification(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_submit_onboarding_for_verification(uuid) TO service_role;
