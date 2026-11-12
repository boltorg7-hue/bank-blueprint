-- Block 2: enforce classic email-registration metadata at the database boundary.
-- OAuth providers are intentionally excluded; their consent step is handled in block 3.
BEGIN;

CREATE OR REPLACE FUNCTION public.validate_email_registration_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  _provider text := COALESCE(NEW.raw_app_meta_data ->> 'provider', '');
  _first_name text := btrim(COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''));
  _last_name text := btrim(COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''));
BEGIN
  IF _provider = 'email' THEN
    IF char_length(_first_name) NOT BETWEEN 2 AND 60
       OR char_length(_last_name) NOT BETWEEN 2 AND 60 THEN
      RAISE EXCEPTION 'invalid registration details'
        USING ERRCODE = '22023';
    END IF;

    IF COALESCE(NEW.raw_user_meta_data ->> 'terms_accepted', 'false') <> 'true' THEN
      RAISE EXCEPTION 'terms acceptance required'
        USING ERRCODE = '22023';
    END IF;

    IF COALESCE(NEW.raw_user_meta_data ->> 'marketing_consent', 'false') NOT IN ('true', 'false') THEN
      RAISE EXCEPTION 'invalid marketing consent'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_email_registration_metadata ON auth.users;

CREATE TRIGGER validate_email_registration_metadata
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.validate_email_registration_metadata();

REVOKE ALL ON FUNCTION public.validate_email_registration_metadata() FROM PUBLIC, anon, authenticated;

COMMIT;
