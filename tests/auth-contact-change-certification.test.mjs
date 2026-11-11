import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("phone OTP creation, delivery and verification fail closed", () => {
  const server = read("src/features/onboarding/services/contact-verification.server.ts");
  const migration = read("supabase/migrations/20261111120000_phone_change_and_otp_hardening.sql");
  assert.ok(server.includes("PHONE_OTP_SECRET"));
  assert.ok(server.includes("OTP_SECRET_NOT_CONFIGURED"));
  assert.ok(server.includes("customer_create_phone_verification"));
  assert.ok(server.includes("customer_verify_phone_code"));
  assert.ok(server.includes("SMS_DELIVERY_FAILED"));
  assert.ok(migration.includes("FOR UPDATE"));
  assert.ok(migration.includes("attempts = LEAST(attempts + 1, 5)"));
  assert.ok(migration.includes("consumed_at = _verified_at"));
  assert.doesNotMatch(server, /development-only-secret/);
});

test("phone change is international, authenticated and invalidates old OTPs", () => {
  const functions = read("src/features/onboarding/services/onboarding.functions.ts");
  const server = read("src/features/onboarding/services/contact-verification.server.ts");
  const page = read("src/routes/verify-contact.tsx");
  const migration = read("supabase/migrations/20261111120000_phone_change_and_otp_hardening.sql");
  assert.ok(functions.includes("changePendingPhone"));
  assert.ok(functions.includes("internationalPhoneSchema"));
  assert.ok(server.includes("customer_change_pending_phone"));
  assert.ok(migration.includes("SET consumed_at = now()"));
  assert.ok(migration.includes("phone_verified_at = NULL"));
  assert.ok(page.includes("Modifier mon numéro"));
  assert.ok(page.includes("nouveau numéro de téléphone international"));
});

test("email change keeps password proof, uniqueness, quota and old-link invalidation", () => {
  const server = read("src/features/auth/services/email-confirmation.server.ts");
  const functions = read("src/features/auth/services/email-confirmation.functions.ts");
  const page = read("src/routes/verify-email.tsx");
  assert.ok(server.includes("signInWithPassword"));
  assert.ok(server.includes("lookupUser(newEmail)"));
  assert.ok(server.includes("Previous email confirmation links could not be invalidated."));
  assert.ok(server.includes("email_confirm: false"));
  assert.ok(functions.includes("currentEmail: email, newEmail: email"));
  assert.ok(page.includes("changePendingEmail"));
  assert.ok(page.includes("Adresse incorrecte ? Modifier mon e-mail"));
  assert.ok(page.includes("Links sent to your previous address are no longer valid."));
});

test("SMS delivery does not silently fall back to simulation", () => {
  const server = read("src/features/notifications/services/notifications.server.ts");
  assert.ok(server.includes('|| "africastalking"'));
  assert.ok(server.includes('providerName === "simulation"'));
  assert.ok(server.includes("SMS_PROVIDER_UNSUPPORTED"));
});
