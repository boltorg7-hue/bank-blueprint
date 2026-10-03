-- Full DB security certification.
-- Run with: supabase test db
-- This complements step7_certification.sql with catalog-wide checks.

DO $$
DECLARE
  r record;
  policy_count integer;
  has_select boolean;
  has_insert boolean;
  has_update boolean;
  has_delete boolean;
BEGIN
  FOR r IN
    SELECT c.oid, n.nspname, c.relname, c.relkind, c.relrowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relispartition
  LOOP
    IF NOT r.relrowsecurity THEN
      RAISE EXCEPTION 'RLS_NOT_ENABLED:%', r.relname;
    END IF;

    SELECT count(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = r.relname;

    IF policy_count = 0 THEN
      RAISE EXCEPTION 'NO_RLS_POLICY:%', r.relname;
    END IF;

    SELECT
      bool_or(cmd IN ('SELECT','*')),
      bool_or(cmd IN ('INSERT','*')),
      bool_or(cmd IN ('UPDATE','*')),
      bool_or(cmd IN ('DELETE','*'))
    INTO has_select, has_insert, has_update, has_delete
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = r.relname;

    RAISE NOTICE 'TABLE=% RLS=ON POLICIES=% SELECT=% INSERT=% UPDATE=% DELETE=%',
      r.relname, policy_count, coalesce(has_select,false), coalesce(has_insert,false),
      coalesce(has_update,false), coalesce(has_delete,false);
  END LOOP;
END $$;

-- SECURITY DEFINER functions must pin search_path to trusted schemas.
DO $$
DECLARE
  r record;
  cfg text;
BEGIN
  FOR r IN
    SELECT p.oid, p.oid::regprocedure AS signature, p.proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
  LOOP
    SELECT value INTO cfg
    FROM unnest(coalesce(r.proconfig, ARRAY[]::text[])) AS value
    WHERE value LIKE 'search_path=%'
    LIMIT 1;

    IF cfg IS NULL THEN
      RAISE EXCEPTION 'SECURITY_DEFINER_WITHOUT_SEARCH_PATH:%', r.signature;
    END IF;
  END LOOP;
END $$;

-- Public execution must not be granted to SECURITY DEFINER functions by default.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  LOOP
    RAISE EXCEPTION 'ANON_CAN_EXECUTE_SECURITY_DEFINER:%', r.signature;
  END LOOP;
END $$;
