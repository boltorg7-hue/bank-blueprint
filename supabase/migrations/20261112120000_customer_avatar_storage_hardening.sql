BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_storage_path text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_avatar_storage_path_format'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_avatar_storage_path_format
      CHECK (
        avatar_storage_path IS NULL
        OR avatar_storage_path ~
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
      );
  END IF;
END;
$$;

INSERT INTO storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
VALUES (
  'customer-avatars',
  'customer-avatars',
  false,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Customer avatar owner read" ON storage.objects;
CREATE POLICY "Customer avatar owner read"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'customer-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Customer avatar owner upload" ON storage.objects;
CREATE POLICY "Customer avatar owner upload"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'customer-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND metadata->>'mimetype' IN ('image/jpeg', 'image/png', 'image/webp')
  AND CASE
    WHEN metadata->>'size' ~ '^[0-9]+$'
      THEN (metadata->>'size')::bigint BETWEEN 1 AND 3145728
    ELSE false
  END
  AND (
    (metadata->>'mimetype' = 'image/jpeg' AND name ~ '\.jpg$')
    OR (metadata->>'mimetype' = 'image/png' AND name ~ '\.png$')
    OR (metadata->>'mimetype' = 'image/webp' AND name ~ '\.webp$')
  )
);

DROP POLICY IF EXISTS "Customer avatar owner delete unlinked" ON storage.objects;
CREATE POLICY "Customer avatar owner delete unlinked"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'customer-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.avatar_storage_path = name
  )
);

COMMENT ON COLUMN public.profiles.avatar_storage_path IS
  'Private customer avatar object path. Never store a public URL; serve short-lived signed URLs only.';

COMMIT;
