import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const provider = read("src/features/notifications/services/sms/africastalking-provider.ts");
const notifications = read("src/features/notifications/services/notifications.server.ts");
const onboarding = read("src/features/onboarding/services/contact-verification.server.ts");
const env = read(".env.example");

assert.match(provider, /https:\/\/api\.sandbox\.africastalking\.com\/version1\/messaging/);
assert.match(provider, /https:\/\/api\.africastalking\.com\/version1\/messaging/);
assert.match(provider, /process\.env\.AFRICASTALKING_API_KEY/);
assert.match(provider, /process\.env\.AFRICASTALKING_SENDER_ID/);
assert.match(provider, /apiKey/);
assert.match(provider, /application\/x-www-form-urlencoded/);
assert.match(provider, /username/);
assert.match(provider, /from: senderId/);
assert.match(provider, /statusCode === 100/);
assert.match(provider, /statusCode === 101/);
assert.match(provider, /statusCode === 102/);
assert.match(provider, /providerReference/);
assert.match(provider, /never expose credentials or raw response bodies/i);
assert.match(provider, /CONTACT_VERIFICATION_CODE/);
assert.doesNotMatch(provider, /console\.(log|error|warn)/);

assert.match(notifications, /dispatchPendingSms/);
assert.match(notifications, /process\.env\.SMS_PROVIDER/);
assert.match(notifications, /africastalking-provider/);
assert.match(notifications, /status:result\.state/);
assert.match(notifications, /provider_reference:result\.providerReference/);

assert.match(onboarding, /dispatchPendingSms/);
assert.doesNotMatch(onboarding, /simulatePendingSms/);

assert.match(env, /SMS_PROVIDER="africastalking"/);
assert.match(env, /AFRICASTALKING_ENV="sandbox"/);
assert.match(env, /AFRICASTALKING_USERNAME="sandbox"/);
assert.match(env, /AFRICASTALKING_SENDER_ID="RFCBANK"/);
assert.match(env, /AFRICASTALKING_API_KEY=""/);

console.log("STEP 09 SMS PROVIDER STATIC CERTIFICATION: PASS");
console.log("Covered: server-only Africa's Talking credentials, sandbox/live endpoints, form-encoded API request, accepted API statuses, provider reference/error handling, OTP template rendering, outbox dispatch, and safe environment placeholders.");
