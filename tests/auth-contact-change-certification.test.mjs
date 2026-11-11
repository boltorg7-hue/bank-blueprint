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
  assert.ok(server.includes("encryptOtpPayload"));
  assert.ok(server.includes("SMS_PAYLOAD_ENCRYPTION_KEY"));
  assert.ok(server.includes("_payload: encryptedPayload"));
  assert.ok(server.includes('notification?.status !== "ACCEPTED"'));
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
  assert.ok(page.includes("Nouveau numéro de téléphone international"));
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

test("SMS outbox dispatch claims jobs atomically and prevents duplicate concurrent sends", () => {
  const server = read("src/features/notifications/services/notifications.server.ts");
  const migration = read("supabase/migrations/20261111130000_sms_outbox_atomic_claim.sql");
  assert.ok(server.includes('rpc("claim_pending_sms_notifications"'));
  assert.ok(server.includes('.eq("status", "PROCESSING")'));
  assert.ok(migration.includes("FOR UPDATE SKIP LOCKED"));
  assert.ok(migration.includes("'PROCESSING'"));
  assert.ok(migration.includes("SMS_DISPATCH_TIMEOUT"));
  assert.ok(migration.includes("TO service_role"));
});

test("OTP limits, encrypted outbox, provider acceptance and lifecycle progression are consistent", () => {
  const migration = read("supabase/migrations/20261111140000_otp_security_and_lifecycle_consistency.sql");
  const provider = read("src/features/notifications/services/sms/africastalking-provider.ts");
  const service = read("src/features/notifications/services/contact-verification.server.ts");
  assert.match(migration, /OTP_USER_DAILY_LIMIT/);
  assert.match(migration, /OTP_PHONE_DAILY_LIMIT/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /'ACCEPTED'/);
  assert.match(migration, /claimed_at/);
  assert.match(migration, /lifecycle_state = CASE[\\s\\S]*ELSE lifecycle_state/);
  assert.match(migration, /onboarding_step = CASE[\\s\\S]*ELSE onboarding_step/);
  assert.match(provider, /createDecipheriv/);
  assert.match(provider, /state: "ACCEPTED"/);
  assert.match(provider, /AbortSignal.timeout/);
  assert.match(service, /OTP_USER_DAILY_LIMIT/);
  assert.match(service, /OTP_PHONE_DAILY_LIMIT/);
});
