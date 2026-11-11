import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Google and Apple OAuth users must accept terms and privacy before continuing", () => {
  const consentRoute = read("src/routes/auth.consent.tsx");
  const functions = read("src/features/auth/services/oauth-consent.functions.ts");

  assert.ok(consentRoute.includes('createFileRoute("/auth/consent")'));
  assert.ok(consentRoute.includes('id="oauth-terms"'));
  assert.ok(consentRoute.includes('id="oauth-privacy"'));
  assert.ok(consentRoute.includes("disabled={!termsAccepted || !privacyAccepted || pending}"));
  assert.ok(consentRoute.includes("marketingConsent"));
  assert.ok(functions.includes("termsAccepted: z.literal(true)"));
  assert.ok(functions.includes("privacyAccepted: z.literal(true)"));
  assert.ok(functions.includes('provider !== "google" && provider !== "apple"'));
});

test("OAuth consent is stored by the server with provider identity and versioned evidence", () => {
  const functions = read("src/features/auth/services/oauth-consent.functions.ts");
  const migration = read("supabase/migrations/20261111110000_oauth_consent_security.sql");

  assert.ok(functions.includes("context.claims as AuthClaims | null"));
  assert.ok(functions.includes("record_oauth_registration_consent"));
  assert.ok(functions.includes("_terms_version: TERMS_VERSION"));
  assert.ok(functions.includes("_privacy_version: PRIVACY_VERSION"));
  assert.ok(migration.includes("customer_consent_events"));
  assert.ok(migration.includes("terms_version"));
  assert.ok(migration.includes("privacy_version"));
  assert.ok(migration.includes("raw_app_meta_data ->> 'provider'"));
  assert.ok(migration.includes("GRANT EXECUTE ON FUNCTION public.record_oauth_registration_consent"));
  assert.ok(migration.includes("TO service_role"));
  assert.ok(migration.includes("REVOKE ALL ON FUNCTION public.record_oauth_registration_consent"));
});

test("customers cannot forge or alter consent through direct profile updates", () => {
  const migration = read(
    "supabase/migrations/20261111110000_oauth_consent_security.sql",
  );

  assert.ok(migration.includes("NEW.terms_accepted_at := OLD.terms_accepted_at"));
  assert.ok(migration.includes("NEW.privacy_accepted_at := OLD.privacy_accepted_at"));
  assert.ok(migration.includes("NEW.marketing_consent := OLD.marketing_consent"));
  assert.ok(migration.includes("REVOKE INSERT, UPDATE, DELETE ON public.customer_consent_events"));
});

test("OAuth consent is checked before post-login routing, onboarding and banking access", () => {
  const postLogin = read("src/features/auth/lib/post-login.ts");
  const onboardingRoute = read("src/routes/onboarding.tsx");
  const appRoute = read("src/routes/app.tsx");

  assert.ok(postLogin.includes("getOAuthConsentStatus"));
  assert.ok(postLogin.includes('return "/auth/consent"'));
  assert.ok(onboardingRoute.includes('to: "/auth/consent"'));
  assert.ok(appRoute.includes('to: "/auth/consent"'));
});

test("onboarding server functions enforce consent before every protected action", () => {
  const onboardingFunctions = read("src/features/onboarding/services/onboarding.functions.ts");
  const onboarding = read("src/features/onboarding/services/onboarding.server.ts");
  const guard = read("src/features/auth/services/oauth-consent.server.ts");

  assert.ok(onboardingFunctions.includes("await assertConsent(context.userId)"));
  assert.ok(onboardingFunctions.includes("async function assertConsent(userId: string)"));
  assert.ok(onboardingFunctions.includes("await assertCustomerConsent(userId)"));
  assert.ok(onboarding.includes("assertCustomerConsent(userId)"));
  assert.ok(guard.includes('provider !== "google" && provider !== "apple"'));
  assert.ok(guard.includes("OAUTH_CONSENT_REQUIRED"));
});
