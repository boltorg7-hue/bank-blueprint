CREATE TYPE public.staff_status AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED');

CREATE TABLE public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  public_reference text NOT NULL UNIQUE DEFAULT ('STF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  display_name text NOT NULL,
  department text,
  status public.staff_status NOT NULL DEFAULT 'INVITED',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staff_profiles TO authenticated;
GRANT ALL ON public.staff_profiles TO service_role;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read own profile"
ON public.staff_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE TRIGGER staff_profiles_set_updated_at
BEFORE UPDATE ON public.staff_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.role_permissions (
  role public.app_role NOT NULL,
  permission text NOT NULL CHECK (permission ~ '^[a-z]+([._][a-z]+)*$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, permission),
  CHECK (role <> 'customer'::public.app_role)
);
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action text NOT NULL,
  resource_type text,
  resource_reference text,
  permission_checked text,
  result text NOT NULL CHECK (result IN ('ALLOWED', 'DENIED')),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_events TO authenticated;
GRANT ALL ON public.admin_audit_events TO service_role;
ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;

INSERT INTO public.role_permissions (role, permission) VALUES
  ('support_agent', 'admin.access'),
  ('support_agent', 'customers.read'),
  ('kyc_agent', 'admin.access'),
  ('kyc_agent', 'customers.read'),
  ('kyc_agent', 'kyc.review'),
  ('compliance_officer', 'admin.access'),
  ('compliance_officer', 'customers.read'),
  ('compliance_officer', 'compliance.review'),
  ('compliance_officer', 'audit.read'),
  ('finance_operator', 'admin.access'),
  ('finance_operator', 'accounts.read'),
  ('finance_operator', 'finance.adjustment.create'),
  ('finance_operator', 'ledger.read'),
  ('supervisor', 'admin.access'),
  ('supervisor', 'accounts.read'),
  ('supervisor', 'customers.read'),
  ('supervisor', 'finance.adjustment.approve'),
  ('supervisor', 'settings.manage'),
  ('administrator', 'admin.access'),
  ('administrator', 'accounts.read'),
  ('administrator', 'customers.read'),
  ('administrator', 'settings.manage'),
  ('administrator', 'staff.manage'),
  ('super_admin', 'admin.access'),
  ('super_admin', 'accounts.read'),
  ('super_admin', 'audit.read'),
  ('super_admin', 'compliance.review'),
  ('super_admin', 'customers.read'),
  ('super_admin', 'finance.adjustment.approve'),
  ('super_admin', 'finance.adjustment.create'),
  ('super_admin', 'kyc.review'),
  ('super_admin', 'ledger.read'),
  ('super_admin', 'settings.manage'),
  ('super_admin', 'staff.manage'),
  ('auditor', 'admin.access'),
  ('auditor', 'accounts.read'),
  ('auditor', 'audit.read'),
  ('auditor', 'customers.read'),
  ('auditor', 'ledger.read');

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.staff_profiles sp ON sp.user_id = ur.user_id
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id
      AND ur.role <> 'customer'::public.app_role
      AND sp.status = 'ACTIVE'::public.staff_status
      AND rp.permission = _permission
  );
$$;
REVOKE ALL ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.staff_profiles sp ON sp.user_id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role <> 'customer'::public.app_role
      AND sp.status = 'ACTIVE'::public.staff_status
  );
$$;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

CREATE POLICY "authorized staff read admin audit"
ON public.admin_audit_events FOR SELECT TO authenticated
USING (public.has_permission(auth.uid(), 'audit.read'));

CREATE OR REPLACE FUNCTION public.get_my_staff_context()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _profile public.staff_profiles%ROWTYPE;
  _roles jsonb;
  _permissions jsonb;
  _authorized boolean := false;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('authorized', false);
  END IF;

  SELECT * INTO _profile
  FROM public.staff_profiles
  WHERE user_id = _user_id;

  _authorized := _profile.id IS NOT NULL
    AND _profile.status = 'ACTIVE'::public.staff_status
    AND public.has_permission(_user_id, 'admin.access');

  INSERT INTO public.admin_audit_events (
    actor_user_id, action, permission_checked, result, context
  ) VALUES (
    _user_id,
    'admin.session_checked',
    'admin.access',
    CASE WHEN _authorized THEN 'ALLOWED' ELSE 'DENIED' END,
    jsonb_build_object('staff_status', COALESCE(_profile.status::text, 'NONE'))
  );

  IF NOT _authorized THEN
    RETURN jsonb_build_object('authorized', false);
  END IF;

  UPDATE public.staff_profiles
  SET last_login_at = now()
  WHERE id = _profile.id;

  SELECT COALESCE(jsonb_agg(DISTINCT ur.role::text ORDER BY ur.role::text), '[]'::jsonb)
  INTO _roles
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
    AND ur.role <> 'customer'::public.app_role;

  SELECT COALESCE(jsonb_agg(DISTINCT rp.permission ORDER BY rp.permission), '[]'::jsonb)
  INTO _permissions
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role = ur.role
  WHERE ur.user_id = _user_id
    AND ur.role <> 'customer'::public.app_role;

  RETURN jsonb_build_object(
    'authorized', true,
    'staffReference', _profile.public_reference,
    'displayName', _profile.display_name,
    'department', _profile.department,
    'status', _profile.status::text,
    'roles', _roles,
    'permissions', _permissions
  );
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_staff_context() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_staff_context() TO authenticated, service_role;

COMMENT ON FUNCTION public.is_staff(uuid) IS 'Checks both a non-customer role and an ACTIVE staff profile. SECURITY DEFINER is required so RLS policies can evaluate staff status without exposing staff records.';
COMMENT ON TABLE public.admin_audit_events IS 'Append-only audit trail. Authenticated users have no direct write or delete policy.';