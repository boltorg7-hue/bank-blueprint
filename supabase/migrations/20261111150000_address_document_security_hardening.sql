BEGIN;

-- The identity bucket must remain private and enforce hard upload limits.
INSERT INTO storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
VALUES (
  'identity-documents',
  'identity-documents',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Sensitive onboarding records are read only through their owner or a
-- specifically assigned KYC/compliance role. Generic staff membership is too broad.
CREATE OR REPLACE FUNCTION public.can_access_kyc_documents()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'kyc_agent'::public.app_role)
    OR public.has_role(auth.uid(), 'compliance_officer'::public.app_role)
    OR public.has_role(auth.uid(), 'supervisor'::public.app_role)
    OR public.has_role(auth.uid(), 'administrator'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'auditor'::public.app_role);
$$;

REVOKE ALL ON FUNCTION public.can_access_kyc_documents() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_kyc_documents() TO authenticated, service_role;

-- Address changes must pass through customer_save_onboarding_address(), which
-- locks the profile and enforces the onboarding lifecycle.
REVOKE INSERT, UPDATE, DELETE ON public.customer_addresses FROM authenticated;
GRANT SELECT ON public.customer_addresses TO authenticated;
DROP POLICY IF EXISTS "addresses insert own" ON public.customer_addresses;
DROP POLICY IF EXISTS "addresses update own" ON public.customer_addresses;
DROP POLICY IF EXISTS "addresses delete own" ON public.customer_addresses;
DROP POLICY IF EXISTS "addresses select own or staff" ON public.customer_addresses;
CREATE POLICY "addresses select owner or KYC staff"
ON public.customer_addresses
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.can_access_kyc_documents()
);

-- Document rows may only be created/deleted through server-side RPCs.
REVOKE INSERT, UPDATE, DELETE ON public.verification_documents FROM authenticated;
GRANT SELECT ON public.verification_documents TO authenticated;
DROP POLICY IF EXISTS "documents delete own before submission" ON public.verification_documents;
DROP POLICY IF EXISTS "documents select own or staff" ON public.verification_documents;
CREATE POLICY "documents select owner or KYC staff"
ON public.verification_documents
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.can_access_kyc_documents()
);

-- Apply the same restricted read boundary to identity-review metadata/history.
DROP POLICY IF EXISTS "verifications select own or staff" ON public.identity_verifications;
CREATE POLICY "verifications select owner or KYC staff"
ON public.identity_verifications
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.can_access_kyc_documents()
);

DROP POLICY IF EXISTS "history select own or staff" ON public.verification_status_history;
CREATE POLICY "history select owner or KYC staff"
ON public.verification_status_history
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.can_access_kyc_documents()
);

DROP POLICY IF EXISTS "document status history select own or staff"
ON public.verification_document_status_history;
CREATE POLICY "document status history select owner or KYC staff"
ON public.verification_document_status_history
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.can_access_kyc_documents()
);

-- Direct Storage reads remain limited to the owner or KYC/compliance staff.
DROP POLICY IF EXISTS "identity docs read own or staff" ON storage.objects;
CREATE POLICY "identity docs read owner or KYC staff"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'identity-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.can_access_kyc_documents()
  )
);

-- Restrict uploads to the exact owner/UUID filename convention and declared
-- MIME/size envelope. The server performs an independent byte-signature check.
DROP POLICY IF EXISTS "identity docs upload own" ON storage.objects;
CREATE POLICY "identity docs upload own validated"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'identity-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND name ~ ('^' || auth.uid()::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|heic|webp|pdf)$')
  AND metadata->>'mimetype' IN ('image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf')
  AND CASE
    WHEN metadata->>'size' ~ '^[0-9]+$' THEN (metadata->>'size')::bigint BETWEEN 1 AND 10485760
    ELSE false
  END
);

-- Customers remove documents through the authenticated server function only.
DROP POLICY IF EXISTS "identity docs delete own" ON storage.objects;

-- Enforce bounded, non-empty address values at the database boundary too.
ALTER TABLE public.customer_addresses
  ADD CONSTRAINT customer_addresses_country_length_check
    CHECK (char_length(btrim(country)) BETWEEN 2 AND 60) NOT VALID,
  ADD CONSTRAINT customer_addresses_line1_length_check
    CHECK (char_length(btrim(address_line1)) BETWEEN 3 AND 120) NOT VALID,
  ADD CONSTRAINT customer_addresses_line2_length_check
    CHECK (address_line2 IS NULL OR char_length(btrim(address_line2)) <= 120) NOT VALID,
  ADD CONSTRAINT customer_addresses_city_length_check
    CHECK (char_length(btrim(city)) BETWEEN 2 AND 80) NOT VALID,
  ADD CONSTRAINT customer_addresses_region_length_check
    CHECK (region IS NULL OR char_length(btrim(region)) <= 80) NOT VALID,
  ADD CONSTRAINT customer_addresses_postal_length_check
    CHECK (postal_code IS NULL OR char_length(btrim(postal_code)) <= 20) NOT VALID;

-- Verify the actual object metadata before a document record can be inserted.
CREATE OR REPLACE FUNCTION public.validate_verification_document_storage_object()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  _metadata jsonb;
  _actual_mime text;
  _actual_size bigint;
BEGIN
  IF NEW.storage_path !~ (
    '^' || NEW.user_id::text ||
    '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|heic|webp|pdf)$'
  ) THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT_PATH';
  END IF;

  SELECT metadata
    INTO _metadata
    FROM storage.objects
   WHERE bucket_id = 'identity-documents'
     AND name = NEW.storage_path;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DOCUMENT_OBJECT_NOT_FOUND';
  END IF;

  _actual_mime := _metadata->>'mimetype';
  IF (_metadata->>'size') ~ '^[0-9]+$' THEN
    _actual_size := (_metadata->>'size')::bigint;
  ELSE
    _actual_size := NULL;
  END IF;

  IF _actual_mime NOT IN ('image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf')
     OR _actual_size IS NULL
     OR _actual_size NOT BETWEEN 1 AND 10485760
     OR NEW.mime_type IS DISTINCT FROM _actual_mime
     OR NEW.size_bytes IS DISTINCT FROM _actual_size THEN
    RAISE EXCEPTION 'DOCUMENT_METADATA_MISMATCH';
  END IF;

  IF NEW.original_filename IS NULL
     OR char_length(NEW.original_filename) NOT BETWEEN 1 AND 255
     OR NEW.original_filename ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT_FILENAME';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS verification_documents_storage_object_guard
ON public.verification_documents;
CREATE TRIGGER verification_documents_storage_object_guard
BEFORE INSERT ON public.verification_documents
FOR EACH ROW
EXECUTE FUNCTION public.validate_verification_document_storage_object();

COMMIT;
