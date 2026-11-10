-- Atomic lifecycle guards for customer onboarding mutations.
-- Customer edits lock the profile row and perform the related writes in the same
-- transaction, so an administrator lifecycle transition cannot race past them.

CREATE OR REPLACE FUNCTION public.customer_save_onboarding_address(
  _user_id uuid,
  _country text,
  _address_line1 text,
  _address_line2 text DEFAULT NULL,
  _city text DEFAULT NULL,
  _region text DEFAULT NULL,
  _postal_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lifecycle public.customer_lifecycle_state;
  _phone_verified_at timestamptz;
  _address_id uuid;
BEGIN
  SELECT lifecycle_state, phone_verified_at INTO _lifecycle, _phone_verified_at
    FROM public.profiles
   WHERE id = _user_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND'; END IF;
  IF _lifecycle NOT IN (
    'PROFILE_INCOMPLETE','IDENTITY_REQUIRED','ADDITIONAL_DOCUMENT_REQUIRED'
  ) THEN
    RAISE EXCEPTION 'ONBOARDING_STATE_LOCKED';
  END IF;
  IF _phone_verified_at IS NULL THEN RAISE EXCEPTION 'PHONE_VERIFICATION_REQUIRED'; END IF;

  IF NULLIF(btrim(_country), '') IS NULL
     OR NULLIF(btrim(_address_line1), '') IS NULL
     OR NULLIF(btrim(_city), '') IS NULL THEN
    RAISE EXCEPTION 'INVALID_ADDRESS';
  END IF;

  SELECT id INTO _address_id
    FROM public.customer_addresses
   WHERE user_id = _user_id AND is_primary = true
   FOR UPDATE;

  IF _address_id IS NULL THEN
    INSERT INTO public.customer_addresses (
      user_id, country, address_line1, address_line2, city, region, postal_code, is_primary
    ) VALUES (
      _user_id, btrim(_country), btrim(_address_line1), NULLIF(btrim(_address_line2), ''),
      btrim(_city), NULLIF(btrim(_region), ''), NULLIF(btrim(_postal_code), ''), true
    );
  ELSE
    UPDATE public.customer_addresses
       SET country = btrim(_country),
           address_line1 = btrim(_address_line1),
           address_line2 = NULLIF(btrim(_address_line2), ''),
           city = btrim(_city),
           region = NULLIF(btrim(_region), ''),
           postal_code = NULLIF(btrim(_postal_code), '')
     WHERE id = _address_id;
  END IF;

  UPDATE public.profiles
     SET onboarding_step = 'IDENTITY'
   WHERE id = _user_id
     AND onboarding_step IN ('NOT_STARTED','CONTACT','PERSONAL_DETAILS','ADDRESS');
END;
$$;

CREATE OR REPLACE FUNCTION public.customer_register_onboarding_document(
  _user_id uuid,
  _document_type public.verification_document_type,
  _storage_path text,
  _original_filename text DEFAULT NULL,
  _mime_type text DEFAULT NULL,
  _size_bytes bigint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lifecycle public.customer_lifecycle_state;
  _phone_verified_at timestamptz;
  _verification public.identity_verifications;
BEGIN
  SELECT lifecycle_state, phone_verified_at INTO _lifecycle, _phone_verified_at
    FROM public.profiles
   WHERE id = _user_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND'; END IF;
  IF _lifecycle NOT IN (
    'PROFILE_INCOMPLETE','IDENTITY_REQUIRED','ADDITIONAL_DOCUMENT_REQUIRED'
  ) THEN
    RAISE EXCEPTION 'ONBOARDING_STATE_LOCKED';
  END IF;
  IF _phone_verified_at IS NULL THEN RAISE EXCEPTION 'PHONE_VERIFICATION_REQUIRED'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.customer_addresses WHERE user_id = _user_id AND is_primary = true) THEN
    RAISE EXCEPTION 'ADDRESS_REQUIRED';
  END IF;

  IF _storage_path IS NULL OR btrim(_storage_path) = ''
     OR position((_user_id::text || '/') in _storage_path) <> 1 THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT_PATH';
  END IF;
  IF _document_type IS NULL OR _size_bytes IS NULL OR _size_bytes <= 0 THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT';
  END IF;

  INSERT INTO public.identity_verifications (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO _verification
    FROM public.identity_verifications
   WHERE user_id = _user_id
   FOR UPDATE;

  IF _verification.status NOT IN (
    'NOT_STARTED','IN_PROGRESS','ADDITIONAL_INFORMATION_REQUIRED','REJECTED'
  ) THEN
    RAISE EXCEPTION 'VERIFICATION_NOT_EDITABLE';
  END IF;

  INSERT INTO public.verification_documents (
    verification_id, user_id, document_type, storage_path,
    original_filename, mime_type, size_bytes
  ) VALUES (
    _verification.id, _user_id, _document_type, _storage_path,
    _original_filename, _mime_type, _size_bytes
  );

  IF _verification.status = 'NOT_STARTED' THEN
    UPDATE public.identity_verifications
       SET status = 'IN_PROGRESS'
     WHERE id = _verification.id;
  END IF;

  UPDATE public.profiles
     SET onboarding_step = 'DOCUMENTS'
   WHERE id = _user_id
     AND onboarding_step IN ('NOT_STARTED','CONTACT','PERSONAL_DETAILS','ADDRESS','IDENTITY');
END;
$$;

CREATE OR REPLACE FUNCTION public.customer_remove_onboarding_document(
  _user_id uuid,
  _document_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lifecycle public.customer_lifecycle_state;
  _phone_verified_at timestamptz;
  _verification public.identity_verifications;
  _storage_path text;
BEGIN
  SELECT lifecycle_state, phone_verified_at INTO _lifecycle, _phone_verified_at
    FROM public.profiles
   WHERE id = _user_id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOMER_PROFILE_NOT_FOUND'; END IF;
  IF _lifecycle NOT IN (
    'PROFILE_INCOMPLETE','IDENTITY_REQUIRED','ADDITIONAL_DOCUMENT_REQUIRED'
  ) THEN
    RAISE EXCEPTION 'ONBOARDING_STATE_LOCKED';
  END IF;
  IF _phone_verified_at IS NULL THEN RAISE EXCEPTION 'PHONE_VERIFICATION_REQUIRED'; END IF;

  SELECT * INTO _verification
    FROM public.identity_verifications
   WHERE user_id = _user_id
   FOR UPDATE;

  IF NOT FOUND OR _verification.status NOT IN (
    'NOT_STARTED','IN_PROGRESS','ADDITIONAL_INFORMATION_REQUIRED','REJECTED'
  ) THEN
    RAISE EXCEPTION 'DOCUMENT_NOT_EDITABLE';
  END IF;

  SELECT storage_path INTO _storage_path
    FROM public.verification_documents
   WHERE id = _document_id
     AND user_id = _user_id
     AND verification_id = _verification.id
   FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'DOCUMENT_NOT_FOUND'; END IF;

  DELETE FROM public.verification_documents
   WHERE id = _document_id
     AND user_id = _user_id;

  RETURN _storage_path;
END;
$$;

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
     WHERE user_id = _user_id
       AND document_type IN ('IDENTITY_CARD','PASSPORT','RESIDENCE_PERMIT')
  ) INTO _has_identity;

  IF NOT _has_identity THEN RAISE EXCEPTION 'IDENTITY_DOCUMENT_REQUIRED'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.verification_documents
     WHERE user_id = _user_id
       AND document_type = 'PROOF_OF_ADDRESS'
  ) INTO _has_address_proof;

  IF NOT _has_address_proof THEN RAISE EXCEPTION 'PROOF_OF_ADDRESS_REQUIRED'; END IF;

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
   WHERE user_id = _user_id AND status = 'UPLOADED';

  UPDATE public.profiles
     SET lifecycle_state = 'IDENTITY_SUBMITTED',
         onboarding_step = 'COMPLETED'
   WHERE id = _user_id;

  RETURN QUERY SELECT 'SUBMITTED'::public.identity_verification_status, false;
END;
$$;

REVOKE ALL ON FUNCTION public.customer_save_onboarding_address(uuid, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.customer_register_onboarding_document(uuid, public.verification_document_type, text, text, text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.customer_remove_onboarding_document(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.customer_submit_onboarding_for_verification(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.customer_save_onboarding_address(uuid, text, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.customer_register_onboarding_document(uuid, public.verification_document_type, text, text, text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.customer_remove_onboarding_document(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.customer_submit_onboarding_for_verification(uuid) TO service_role;
