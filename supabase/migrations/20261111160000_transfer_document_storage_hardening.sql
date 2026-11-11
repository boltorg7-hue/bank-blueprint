BEGIN;

-- Transfer evidence is private, bounded and limited to the formats exposed by
-- the customer upload form.
INSERT INTO storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
VALUES (
  'transfer-documents',
  'transfer-documents',
  false,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- A generic staff role is not sufficient to read customer transfer evidence.
DROP POLICY IF EXISTS "Customers read their own transfer documents"
ON public.transfer_documents;
CREATE POLICY "Transfer documents owner or compliance readers"
ON public.transfer_documents
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_permission(auth.uid(), 'compliance.review')
  OR public.has_permission(auth.uid(), 'transfers.approve')
);

DROP POLICY IF EXISTS "Customers read their own transfer documents in storage"
ON storage.objects;
CREATE POLICY "Transfer storage owner or compliance readers"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'transfer-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_permission(auth.uid(), 'compliance.review')
    OR public.has_permission(auth.uid(), 'transfers.approve')
  )
);

-- Uploads must be owner-scoped and inside the bucket's supported MIME/size envelope.
DROP POLICY IF EXISTS "Customers upload their own transfer documents"
ON storage.objects;
CREATE POLICY "Transfer uploads owner and bounded"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'transfer-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND metadata->>'mimetype' IN ('image/jpeg', 'image/png', 'image/heic', 'application/pdf')
  AND CASE
    WHEN metadata->>'size' ~ '^[0-9]+$' THEN (metadata->>'size')::bigint BETWEEN 1 AND 15728640
    ELSE false
  END
);

-- Uploaded evidence cannot be overwritten through Storage after submission.
DROP POLICY IF EXISTS "Customers replace their own transfer documents"
ON storage.objects;

CREATE OR REPLACE FUNCTION public.validate_transfer_document_storage_object()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reference text;
  _expected_prefix text;
  _filename text;
  _metadata jsonb;
  _actual_mime text;
  _actual_size bigint;
BEGIN
  IF NEW.requirement_id IS NULL THEN
    RAISE EXCEPTION 'REQUIREMENT_UNAVAILABLE';
  END IF;

  SELECT public_reference
    INTO _reference
    FROM public.transfers
   WHERE id = NEW.transfer_id
     AND sender_user_id = NEW.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRANSFER_UNAVAILABLE';
  END IF;

  _expected_prefix := NEW.user_id::text || '/' || _reference || '/' || NEW.requirement_id::text || '-';
  IF position(_expected_prefix in NEW.storage_path) <> 1
     OR array_length(string_to_array(NEW.storage_path, '/'), 1) <> 3 THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT_PATH';
  END IF;

  _filename := split_part(NEW.storage_path, '/', 3);
  IF _filename !~ ('^' || NEW.requirement_id::text || '-[0-9]{13}\.(jpg|png|heic|pdf)$') THEN
    RAISE EXCEPTION 'INVALID_DOCUMENT_PATH';
  END IF;

  SELECT metadata
    INTO _metadata
    FROM storage.objects
   WHERE bucket_id = 'transfer-documents'
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

  IF _actual_mime NOT IN ('image/jpeg', 'image/png', 'image/heic', 'application/pdf')
     OR _actual_size IS NULL
     OR _actual_size NOT BETWEEN 1 AND 15728640
     OR NEW.mime_type IS DISTINCT FROM _actual_mime
     OR NEW.size_bytes IS DISTINCT FROM _actual_size
     OR NEW.original_filename IS NULL
     OR char_length(NEW.original_filename) NOT BETWEEN 1 AND 200
     OR NEW.original_filename ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'DOCUMENT_METADATA_MISMATCH';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_transfer_document_storage_object()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS transfer_documents_storage_object_guard
ON public.transfer_documents;
CREATE TRIGGER transfer_documents_storage_object_guard
BEFORE INSERT ON public.transfer_documents
FOR EACH ROW
EXECUTE FUNCTION public.validate_transfer_document_storage_object();

COMMIT;
