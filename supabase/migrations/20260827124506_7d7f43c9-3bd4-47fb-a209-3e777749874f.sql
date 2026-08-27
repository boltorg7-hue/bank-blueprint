-- ============ ENUMS ============
CREATE TYPE public.customer_lifecycle_state AS ENUM (
  'VISITOR','REGISTERED','EMAIL_VERIFICATION_REQUIRED','CONTACT_VERIFICATION_REQUIRED',
  'PROFILE_INCOMPLETE','IDENTITY_REQUIRED','IDENTITY_SUBMITTED','IDENTITY_UNDER_REVIEW',
  'ADDITIONAL_DOCUMENT_REQUIRED','IDENTITY_VERIFIED','BANKING_REVIEW','ACTIVE',
  'RESTRICTED','SUSPENDED','CLOSED'
);

CREATE TYPE public.onboarding_step AS ENUM (
  'NOT_STARTED','CONTACT','PERSONAL_DETAILS','ADDRESS','IDENTITY','DOCUMENTS','REVIEW','COMPLETED'
);

CREATE TYPE public.identity_verification_status AS ENUM (
  'NOT_STARTED','IN_PROGRESS','SUBMITTED','UNDER_REVIEW','ADDITIONAL_INFORMATION_REQUIRED',
  'VERIFIED','REJECTED','EXPIRED'
);

CREATE TYPE public.verification_document_type AS ENUM (
  'IDENTITY_CARD','PASSPORT','RESIDENCE_PERMIT','PROOF_OF_ADDRESS','ADDITIONAL_DOCUMENT'
);

CREATE TYPE public.verification_document_status AS ENUM (
  'UPLOADED','UNDER_REVIEW','ACCEPTED','ACTION_REQUIRED','EXPIRED','REJECTED'
);

CREATE TYPE public.app_role AS ENUM (
  'customer','support_agent','kyc_agent','compliance_officer','finance_operator',
  'supervisor','administrator','super_admin','auditor'
);

-- ============ SHARED TRIGGER FN ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role <> 'customer'::public.app_role
  );
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  nationality TEXT,
  country_of_residence TEXT,
  occupation TEXT,
  phone TEXT,
  phone_verified_at TIMESTAMPTZ,
  lifecycle_state public.customer_lifecycle_state NOT NULL DEFAULT 'REGISTERED',
  onboarding_step public.onboarding_step NOT NULL DEFAULT 'NOT_STARTED',
  terms_accepted_at TIMESTAMPTZ,
  privacy_accepted_at TIMESTAMPTZ,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles select own or staff" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid()));

CREATE POLICY "profiles insert own" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles update own" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id AND NOT public.is_staff(auth.uid()) THEN
    NEW.lifecycle_state := OLD.lifecycle_state;
    NEW.phone_verified_at := OLD.phone_verified_at;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_privileged
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone, terms_accepted_at, privacy_accepted_at, marketing_consent, lifecycle_state)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data ->> 'first_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'last_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    CASE WHEN (NEW.raw_user_meta_data ->> 'terms_accepted') = 'true' THEN now() END,
    CASE WHEN (NEW.raw_user_meta_data ->> 'terms_accepted') = 'true' THEN now() END,
    COALESCE((NEW.raw_user_meta_data ->> 'marketing_consent') = 'true', false),
    CASE WHEN NEW.email_confirmed_at IS NULL THEN 'EMAIL_VERIFICATION_REQUIRED'::public.customer_lifecycle_state
         ELSE 'PROFILE_INCOMPLETE'::public.customer_lifecycle_state END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ADDRESSES ============
CREATE TABLE public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  region TEXT,
  postal_code TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX customer_addresses_one_primary
ON public.customer_addresses (user_id) WHERE is_primary;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses select own or staff" ON public.customer_addresses
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "addresses insert own" ON public.customer_addresses
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses update own" ON public.customer_addresses
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses delete own" ON public.customer_addresses
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER customer_addresses_set_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ IDENTITY VERIFICATION ============
CREATE TABLE public.identity_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.identity_verification_status NOT NULL DEFAULT 'NOT_STARTED',
  submitted_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decision_reason TEXT,
  requested_information TEXT,
  provider TEXT,
  provider_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.identity_verifications TO authenticated;
GRANT ALL ON public.identity_verifications TO service_role;
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verifications select own or staff" ON public.identity_verifications
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE TRIGGER identity_verifications_set_updated_at
BEFORE UPDATE ON public.identity_verifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ VERIFICATION DOCUMENTS ============
CREATE TABLE public.verification_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES public.identity_verifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type public.verification_document_type NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  original_filename TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  status public.verification_document_status NOT NULL DEFAULT 'UPLOADED',
  expires_at DATE,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON public.verification_documents TO authenticated;
GRANT ALL ON public.verification_documents TO service_role;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents select own or staff" ON public.verification_documents
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "documents delete own before submission" ON public.verification_documents
FOR DELETE TO authenticated USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.identity_verifications v
    WHERE v.id = verification_id
      AND v.status IN ('NOT_STARTED','IN_PROGRESS','ADDITIONAL_INFORMATION_REQUIRED')
  )
);

CREATE TRIGGER verification_documents_set_updated_at
BEFORE UPDATE ON public.verification_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ STATUS HISTORY (AUDIT) ============
CREATE TABLE public.verification_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES public.identity_verifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_status public.identity_verification_status,
  new_status public.identity_verification_status NOT NULL,
  changed_by UUID,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.verification_status_history TO authenticated;
GRANT ALL ON public.verification_status_history TO service_role;
ALTER TABLE public.verification_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "history select own or staff" ON public.verification_status_history
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- ============ PRIVATE DOCUMENT STORAGE POLICIES ============
CREATE POLICY "identity docs read own or staff" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'identity-documents'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid()))
);

CREATE POLICY "identity docs upload own" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'identity-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "identity docs delete own" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'identity-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);