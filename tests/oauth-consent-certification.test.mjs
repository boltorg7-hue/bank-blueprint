import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("OAuth consent page lets customers continue without recording an unaccepted consent", () => {
  const consentRoute = read("src/routes/auth.consent.tsx");
  const functions = read("src/features/auth/services/oauth-consent.functions.ts");

  assert.ok(consentRoute.includes('createFileRoute("/auth/consent")'));
  assert.ok(consentRoute.includes('id="oauth-terms"'));
  assert.ok(consentRoute.includes('id="oauth-privacy"'));
  assert.ok(consentRoute.includes("if (documentsPublished && termsAccepted && privacyAccepted)"));
  assert.ok(consentRoute.includes("Continuer mon inscription"));
  assert.ok(consentRoute.includes("Votre consentement restera en attente"));
  assert.ok(functions.includes("termsAccepted: z.literal(true)"));
  assert.ok(functions.includes("privacyAccepted: z.literal(true)"));
  assert.ok(functions.includes('provider !== "google" && provider !== "apple"'));
});

test("OAuth consent is stored by the server with provider identity and current document versions", () => {
  const functions = read("src/features/auth/services/oauth-consent.functions.ts");
  const migration = read("supabase/migrations/20261111110000_oauth_consent_security.sql");

  assert.ok(functions.includes("context.claims as AuthClaims | null"));
  assert.ok(functions.includes("record_oauth_registration_consent"));
  assert.ok(functions.includes("_terms_version: TERMS_DOCUMENT.lastUpdated"));
  assert.ok(functions.includes("_privacy_version: PRIVACY_DOCUMENT.lastUpdated"));
  assert.ok(migration.includes("customer_consent_events"));
  assert.ok(migration.includes("terms_version"));
  assert.ok(migration.includes("privacy_version"));
  assert.ok(migration.includes("raw_app_meta_data ->> 'provider'"));
  assert.ok(migration.includes("GRANT EXECUTE ON FUNCTION public.record_oauth_registration_consent"));
  assert.ok(migration.includes("TO service_role"));
  assert.ok(migration.includes("REVOKE ALL ON FUNCTION public.record_oauth_registration_consent"));
});

test("customers cannot forge or alter consent through direct profile updates", () => {
  const migration = read("supabase/migrations/20261111110000_oauth_consent_security.sql");

  assert.ok(migration.includes("NEW.terms_accepted_at := OLD.terms_accepted_at"));
  assert.ok(migration.includes("NEW.privacy_accepted_at := OLD.privacy_accepted_at"));
  assert.ok(migration.includes("NEW.marketing_consent := OLD.marketing_consent"));
  assert.ok(migration.includes("REVOKE INSERT, UPDATE, DELETE ON public.customer_consent_events"));
});

test("OAuth consent does not block onboarding, while banking entry remains protected", () => {
  const postLogin = read("src/features/auth/lib/post-login.ts");
  const onboardingRoute = read("src/routes/onboarding.tsx");
  const onboardingFunctions = read("src/features/onboarding/services/onboarding.functions.ts");
  const onboardingServer = read("src/features/onboarding/services/onboarding.server.ts");
  const appRoute = read("src/routes/app.tsx");

  assert.ok(!postLogin.includes("getOAuthConsentStatus"));
  assert.ok(!onboardingRoute.includes("getOAuthConsentStatus"));
  assert.ok(!onboardingFunctions.includes("assertCustomerConsent"));
  assert.ok(!onboardingServer.includes("assertCustomerConsent"));
  assert.ok(appRoute.includes("getOAuthConsentStatus"));
  assert.ok(appRoute.includes('to: "/auth/consent"'));
});

test("onboarding dashboard reports legal consent still pending without blocking verified steps", () => {
  const dashboard = read("src/routes/onboarding.index.tsx");
  const tasks = read("src/features/onboarding/lib/tasks.ts");

  assert.ok(dashboard.includes('id: "legal-consent"'));
  assert.ok(dashboard.includes('route: "/auth/consent"'));
  assert.ok(tasks.includes("const emailDone = context.emailVerified"));
  assert.ok(tasks.includes("const contactDone = Boolean(context.profile.phone_verified_at)"));
  assert.ok(tasks.includes('id: "email"'));
  assert.ok(tasks.includes('id: "contact"'));
});

test("OAuth consent distinguishes provider sign-in from bank KYC", () => {
  const route = read("src/routes/auth.consent.tsx");
  assert.ok(route.includes("not bank identity verification (KYC)"));
  assert.ok(route.includes("ne constitue pas une vérification d’identité bancaire (KYC)"));
  assert.ok(route.includes("official Terms and Privacy Policy are not yet fully published"));
  assert.ok(route.includes("ne sont pas encore intégralement publiées"));
});
