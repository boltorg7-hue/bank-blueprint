-- STEP 2 — Durable customer preferences, separate from identity and banking data.
CREATE TABLE public.customer_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'fr' CHECK (language IN ('fr','en')),
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  privacy_mode_default boolean NOT NULL DEFAULT false,
  sms_transactions boolean NOT NULL DEFAULT true,
  sms_security boolean NOT NULL DEFAULT true,
  email_service boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.customer_preferences TO authenticated;
GRANT ALL ON public.customer_preferences TO service_role;
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers read own preferences" ON public.customer_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "customers create own preferences" ON public.customer_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "customers update own preferences" ON public.customer_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER customer_preferences_updated BEFORE UPDATE ON public.customer_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.customer_preferences IS 'Non-financial presentation and communication preferences. Identity, lifecycle and account state remain in their authoritative domains.';
