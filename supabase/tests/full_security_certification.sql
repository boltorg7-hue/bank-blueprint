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

-- Financial/admin state changes must remain behind server-side functions/RPCs.
DO $$
DECLARE
  _table text;
BEGIN
  FOREACH _table IN ARRAY ARRAY[
    'bank_accounts','ledger_accounts','ledger_transactions','ledger_entries',
    'transfers','transfer_requirements','funding_requests','admin_audit_events'
  ] LOOP
    IF has_table_privilege('authenticated', format('public.%I', _table), 'INSERT')
       OR has_table_privilege('authenticated', format('public.%I', _table), 'UPDATE')
       OR has_table_privilege('authenticated', format('public.%I', _table), 'DELETE')
    THEN
      RAISE EXCEPTION 'AUTHENTICATED_DIRECT_WRITE:%', _table;
    END IF;

    IF has_table_privilege('anon', format('public.%I', _table), 'SELECT')
       OR has_table_privilege('anon', format('public.%I', _table), 'INSERT')
       OR has_table_privilege('anon', format('public.%I', _table), 'UPDATE')
       OR has_table_privilege('anon', format('public.%I', _table), 'DELETE')
    THEN
      RAISE EXCEPTION 'ANON_TABLE_PRIVILEGE:%', _table;
    END IF;
  END LOOP;
END $$;



-- Sensitive policy semantics: no anonymous/public policy surface, and any
-- authenticated SELECT policy must be explicitly scoped to the owner or a
-- staff/admin permission boundary.
DO $$
DECLARE
  _table text;
  _policy record;
  _qual text;
BEGIN
  FOREACH _table IN ARRAY ARRAY[
    'bank_accounts','account_balances','ledger_accounts','ledger_transactions','ledger_entries',
    'transfers','transfer_requirements','transfer_compliance_cases','funding_requests',
    'identity_verifications','verification_documents','customer_documents','notifications',
    'admin_audit_events','account_status_history','support_threads','support_messages',
    'customer_security_sessions','customer_security_events','security_step_up_grants'
  ] LOOP
    FOR _policy IN
      SELECT policyname, cmd, roles, qual, with_check
      FROM pg_policies
      WHERE schemaname='public' AND tablename=_table
    LOOP
      IF EXISTS (SELECT 1 FROM unnest(coalesce(_policy.roles, ARRAY[]::name[])) AS role_name WHERE role_name IN ('anon','public')) THEN
        RAISE EXCEPTION 'SENSITIVE_POLICY_EXPOSES_ANON_OR_PUBLIC:%:%', _table, _policy.policyname;
      END IF;

      IF _policy.cmd IN ('SELECT','ALL','*')
         AND EXISTS (SELECT 1 FROM unnest(coalesce(_policy.roles, ARRAY[]::name[])) AS role_name WHERE role_name='authenticated')
      THEN
        _qual := coalesce(_policy.qual,'') || ' ' || coalesce(_policy.with_check,'');
        IF _qual !~* 'auth\\.uid\\s*\\(\\)|has_permission\\s*\\(|is_staff\\s*\\(' THEN
          RAISE EXCEPTION 'AUTHENTICATED_POLICY_NOT_SCOPED:%:%', _table, _policy.policyname;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;
