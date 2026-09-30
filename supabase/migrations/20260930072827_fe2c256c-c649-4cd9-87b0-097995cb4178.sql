CREATE TABLE public.email_confirmation_links (
  email text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  current_nonce uuid NOT NULL DEFAULT gen_random_uuid(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_confirmation_links TO service_role;
ALTER TABLE public.email_confirmation_links ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.email_confirmation_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_confirmation_sends_email_idx ON public.email_confirmation_sends(email, created_at DESC);
GRANT ALL ON public.email_confirmation_sends TO service_role;
ALTER TABLE public.email_confirmation_sends ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.onboarding_assistant_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX onboarding_assistant_questions_user_idx ON public.onboarding_assistant_questions(user_id, created_at DESC);
GRANT ALL ON public.onboarding_assistant_questions TO service_role;
ALTER TABLE public.onboarding_assistant_questions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.auth_user_for_email(_email text)
RETURNS TABLE(id uuid, email_confirmed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT u.id, u.email_confirmed_at FROM auth.users u WHERE lower(u.email) = lower(_email) LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.auth_user_for_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_for_email(text) TO service_role;