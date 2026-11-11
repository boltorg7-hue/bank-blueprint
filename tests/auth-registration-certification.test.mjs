import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("registration handles rejected signup requests without exposing backend errors", () => {
  const form = read("src/features/auth/components/RegisterForm.tsx");
  const server = read("src/features/auth/services/registration.server.ts");
  assert.ok(form.includes("try {"));
  assert.ok(form.includes("registerCustomer({ data: parsed.data })"));
  assert.ok(form.includes("catch {"));
  assert.ok(form.includes("signUpErrorMessage({ code: result.code }"));
  assert.ok(form.includes("setPending(false)"));
  assert.ok(server.includes("authClient.auth.signUp"));
  assert.doesNotMatch(form, /setFormError\([^\n]*\.message/);
});

test("registration prevents duplicate submission and requires accessible identity fields", () => {
  const form = read("src/features/auth/components/RegisterForm.tsx");
  assert.ok(form.includes("if (pending) return"));
  assert.ok(form.includes("disabled={pending}"));
  assert.ok(form.includes("autoComplete={autoComplete}"));
  assert.ok(form.includes("aria-invalid={error ? true : undefined}"));
  assert.ok(form.includes("required"));
});

test("registration validates consent and password confirmation before creating an account", () => {
  const schema = read("src/features/auth/schemas/auth.schemas.ts");
  const form = read("src/features/auth/components/RegisterForm.tsx");
  const server = read("src/features/auth/services/registration.server.ts");
  assert.ok(schema.includes("terms: z.literal(true"));
  assert.ok(schema.includes("value.password === value.confirmPassword"));
  assert.ok(form.includes("registerSchema.safeParse"));
  assert.ok(server.includes("marketing_consent"));
});

test("classic registration is validated and executed on the server", () => {
  const functions = read("src/features/auth/services/registration.functions.ts");
  const server = read("src/features/auth/services/registration.server.ts");
  const form = read("src/features/auth/components/RegisterForm.tsx");
  assert.ok(functions.includes("registerSchema.parse(input)"));
  assert.ok(functions.includes("createCustomerRegistration(data)"));
  assert.ok(server.includes("authClient.auth.signUp"));
  assert.ok(server.includes("SUPABASE_PUBLISHABLE_KEY"));
  assert.ok(server.includes("createSupabaseFetch(key)"));
  assert.ok(!server.includes("SUPABASE_SERVICE_ROLE_KEY"));
  assert.ok(form.includes("registerCustomer({ data: parsed.data })"));
  assert.ok(form.includes("supabase.auth.setSession"));
  assert.ok(!form.includes("supabase.auth.signUp"));
});

test("email registration metadata is also guarded by the database", () => {
  const migrations = read(
    "supabase/migrations/20261111100000_auth_registration_server_validation.sql",
  );
  assert.ok(migrations.includes("BEFORE INSERT ON auth.users"));
  assert.ok(migrations.includes("validate_email_registration_metadata"));
  assert.ok(migrations.includes("char_length(_first_name) NOT BETWEEN 2 AND 60"));
  assert.ok(migrations.includes("terms_accepted"));
  assert.ok(migrations.includes("_provider = 'email'"));
});


test("email confirmation resend fails closed when quota or audit persistence fails", () => {
  const server = read("src/features/auth/services/email-confirmation.server.ts");
  assert.ok(server.includes("if (error) throw new Error(\"Email confirmation quota could not be checked.\""));
  assert.ok(server.includes("if (logError) throw new Error(\"Email confirmation send could not be recorded.\""));
  assert.ok(server.includes("if (error) throw new Error(\"Email account lookup failed.\""));
  assert.ok(server.includes("if (error) throw new Error(\"Email confirmation link could not be recorded.\""));
});

test("public resend response does not disclose whether an email account exists or is verified", () => {
  const server = read("src/features/auth/services/email-confirmation.server.ts");
  const page = read("src/routes/verify-email.tsx");
  assert.ok(server.includes("Keep the response indistinguishable for unknown and already-verified addresses."));
  assert.ok(server.includes('kind: "resend_verified"'));
  assert.ok(server.includes('kind: "resend_unknown"'));
  assert.ok(server.includes('return { ok: true, retryAfter: quota.retryAfter, remaining: 0 }'));
  assert.ok(server.includes("Keep provider-level throttling indistinguishable from the neutral public response."));
  assert.ok(page.includes("If this address can receive a confirmation link"));
  assert.ok(page.includes("Si cette adresse peut recevoir un lien de confirmation"));
});

test("email callback requires GoTrue confirmation and the latest issued nonce", () => {
  const functions = read("src/features/auth/services/email-confirmation.functions.ts");
  const server = read("src/features/auth/services/email-confirmation.server.ts");
  assert.ok(functions.includes("!user.email_confirmed_at"));
  assert.ok(functions.includes("isLatestConfirmationLink(user.email, data.nonce)"));
  assert.ok(server.includes("data.current_nonce === nonce"));
  assert.ok(server.includes("Boolean(nonce)"));
  assert.ok(server.includes("Email confirmation link could not be verified."));
  assert.ok(server.includes("Previous email confirmation links could not be invalidated."));
});

test("email confirmation sends use a strict HTTPS application origin", () => {
  const functions = read("src/features/auth/services/email-confirmation.functions.ts");
  assert.ok(functions.includes('url.protocol !== "https:"'));
  assert.ok(functions.includes("url.username"));
  assert.ok(functions.includes("url.password"));
  assert.ok(functions.includes("url.search"));
  assert.ok(functions.includes("url.hash"));
});


test("profile onboarding preserves progress and reuses verified contact across all sign-in providers", () => {
  const server = read("src/features/onboarding/services/onboarding.server.ts");
  const functions = read("src/features/onboarding/services/onboarding.functions.ts");
  const page = read("src/routes/onboarding.profile.tsx");
  assert.ok(functions.includes("data.user.user_metadata"));
  assert.ok(server.includes("profileNameHints(authMetadata)"));
  assert.ok(server.includes("Provider names are suggestions only"));
  assert.ok(server.includes("const phoneUnchanged = currentProfile.phone === data.phone"));
  assert.ok(server.includes("customer_change_pending_phone"));
  assert.ok(server.includes("const contactVerified = phoneUnchanged"));
  assert.ok(server.includes("const onboardingStep = phoneUnchanged"));
  assert.ok(!server.includes("phone: data.phone"));
  assert.ok(server.includes("CUSTOMER_DOCUMENTS_UNAVAILABLE"));
  assert.ok(page.includes('navigate({ to: "/onboarding", replace: true })'));
  assert.ok(page.includes("required={required}"));
});

test("profile context fails closed instead of treating database read failures as missing onboarding steps", () => {
  const server = read("src/features/onboarding/services/onboarding.server.ts");
  assert.ok(server.includes("if (profileReadError) throw new OnboardingError"));
  assert.ok(server.includes("if (verificationReadError) throw new OnboardingError"));
  assert.ok(server.includes("if (addressError) throw new OnboardingError"));
  assert.ok(server.includes("if (documentsError) throw new OnboardingError"));
});

test("phone OTP and phone/email change controls are part of certification", () => {
  const server = read("src/features/onboarding/services/contact-verification.server.ts");
  const functions = read("src/features/onboarding/services/onboarding.functions.ts");
  const phonePage = read("src/routes/verify-contact.tsx");
  const emailServer = read("src/features/auth/services/email-confirmation.server.ts");
  const emailPage = read("src/routes/verify-email.tsx");
  const migration = read("supabase/migrations/20261111120000_phone_change_and_otp_hardening.sql");
  const sms = read("src/features/notifications/services/notifications.server.ts");
  assert.ok(server.includes("PHONE_OTP_SECRET"));
  assert.ok(server.includes("OTP_SECRET_NOT_CONFIGURED"));
  assert.ok(server.includes("customer_create_phone_verification"));
  assert.ok(server.includes("customer_verify_phone_code"));
  assert.ok(functions.includes("changePendingPhone"));
  assert.ok(phonePage.includes("Modifier mon numéro"));
  assert.ok(migration.includes("customer_change_pending_phone"));
  assert.ok(migration.includes("attempts = LEAST(attempts + 1, 5)"));
  assert.ok(migration.includes("OTP_SUPERSEDED"));
  assert.ok(emailServer.includes("signInWithPassword"));
  assert.ok(emailServer.includes("lookupUser(newEmail)"));
  assert.ok(emailServer.includes("Previous email confirmation links could not be invalidated."));
  assert.ok(emailPage.includes("Adresse incorrecte ? Modifier mon e-mail"));
  assert.ok(sms.includes('|| "africastalking"'));
  assert.ok(sms.includes("SMS_PROVIDER_UNSUPPORTED"));
});

test("post-login resumes the first incomplete server-backed onboarding step", () => {
  const routing = read("src/features/auth/lib/post-login.ts");
  assert.ok(routing.includes("nextOnboardingRoute(context)"));
  assert.ok(routing.includes("if (!context.emailVerified)"));
  assert.ok(routing.includes('lifecycleRoute = "/verify-email"'));
  assert.ok(routing.includes('["ACTIVE", "RESTRICTED", "SUSPENDED", "CLOSED"]'));
});
