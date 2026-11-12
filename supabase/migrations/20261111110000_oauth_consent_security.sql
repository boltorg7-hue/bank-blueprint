-- Block 3: server-authoritative consent capture for Google and Apple identities.
-- Existing profile consent columns are reused; this migration adds an immutable audit trail
-- and prevents customers from changing consent timestamps or marketing preference directly.

BEGIN;

CREATE TABLE IF NOT EXISTS public.customer_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'apple')),
  terms_version text NOT NULL,
  privacy_version text NOT NULL,
  terms_accepted boolean NOT NULL CHECK (terms_accepted),
  privacy_accepted boolean NOT NULL CHECK (privacy_accepted),
  marketing_consent boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_consent_events_user_created_idx
  ON public.customer_consent_events (user_id, created_at DESC);

ALTER TABLE public.customer_consent_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.customer_consent_events TO authenticated;
GRANT ALL ON public.customer_consent_events TO service_role;

DROP POLICY IF EXISTS "customers read own consent events" ON public.customer_consent_events;
CREATE POLICY "customers read own consent events"
  ON public.customer_consent_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- Consent evidence is written only by the trusted server function below.
REVOKE INSERT, UPDATE, DELETE ON public.customer_consent_events FROM PUBLIC, anon, authenticated;

-- Reuse the existing profile protection trigger and extend its protected columns.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id AND NOT public.is_staff(auth.uid()) THEN
    NEW.lifecycle_state := OLD.lifecycle_state;
    NEW.phone_verified_at := OLD.phone_verified_at;
    NEW.terms_accepted_at := OLD.terms_accepted_at;
    NEW.privacy_accepted_at := OLD.privacy_accepted_at;
    NEW.marketing_consent := OLD.marketing_consent;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_oauth_registration_consent(
  _user_id uuid,
  _provider text,
  _terms_version text,
  _privacy_version text,
  _marketing_consent boolean
) RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  _actual_provider text;
  _accepted_at timestamptz := now();
BEGIN
  IF _user_id IS NULL
     OR _provider NOT IN ('google', 'apple')
     OR char_length(COALESCE(_terms_version, '')) NOT BETWEEN 1 AND 40
     OR char_length(COALESCE(_privacy_version, '')) NOT BETWEEN 1 AND 40
     OR _marketing_consent IS NULL THEN
    RAISE EXCEPTION 'invalid consent request' USING ERRCODE = '22023';
  END IF;

  SELECT raw_app_meta_data ->> 'provider'
    INTO _actual_provider
    FROM auth.users
   WHERE id = _user_id;

  IF _actual_provider IS DISTINCT FROM _provider THEN
    RAISE EXCEPTION 'identity provider mismatch' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN
    RAISE EXCEPTION 'customer profile unavailable' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.customer_consent_events (
    user_id, provider, terms_version, privacy_version,
    terms_accepted, privacy_accepted, marketing_consent, created_at
  ) VALUES (
    _user_id, _provider, _terms_version, _privacy_version,
    true, true, _marketing_consent, _accepted_at
  );

  UPDATE public.profiles
     SET terms_accepted_at = _accepted_at,
         privacy_accepted_at = _accepted_at,
         marketing_consent = _marketing_consent
   WHERE id = _user_id;

  RETURN _accepted_at;
END;
$$;

REVOKE ALL ON FUNCTION public.record_oauth_registration_consent(uuid, text, text, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_oauth_registration_consent(uuid, text, text, text, boolean)
  TO service_role;

COMMIT;
