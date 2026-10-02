import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const registerSchema = read("src/features/auth/schemas/auth.schemas.ts");
const registerForm = read("src/features/auth/components/RegisterForm.tsx");
const profileSchema = read("src/features/onboarding/schemas/onboarding.schemas.ts");
const profileRoute = read("src/routes/onboarding.profile.tsx");
const verifyRoute = read("src/routes/verify-contact.tsx");
const onboardingServer = read("src/features/onboarding/services/onboarding.server.ts");
const contactServer = read("src/features/onboarding/services/contact-verification.server.ts");
const choices = read("src/features/onboarding/lib/choices.ts");

assert.doesNotMatch(registerSchema, /phone:/);
assert.doesNotMatch(registerForm, /name="phone"/);
assert.doesNotMatch(registerForm, /formData\.get\("phone"\)/);
assert.match(profileSchema, /internationalPhoneSchema/);
assert.match(profileSchema, /\^\\\+\[1-9\]\\d\{7,14\}\$/);
assert.ok(profileSchema.includes(`replace(/[\\s().-]/g, "")`));
assert.match(profileRoute, /name="phone"/);
assert.match(profileRoute, /defaultValue=\{profile\.phone \?\? ""\}/);
assert.doesNotMatch(profileRoute, /\+1 868/);
assert.doesNotMatch(profileRoute, /Trinidad and Tobago/);
assert.match(onboardingServer, /phone: data\.phone/);
assert.match(onboardingServer, /onboarding_step: data\.phone \? "CONTACT" : "ADDRESS"/);
assert.match(contactServer, /profile\.phone/);
assert.match(profileRoute, /navigate\(\{ to: "\/verify-contact" \}\)/);
assert.match(verifyRoute, /Verification channel/);
assert.match(verifyRoute, /Canal de vérification/);
assert.match(verifyRoute, /SMS is currently the available channel/);
assert.match(verifyRoute, /seul canal disponible/);
assert.match(verifyRoute, /Send code by SMS/);
assert.match(verifyRoute, /Recevoir le code par SMS/);

for (const country of [
  "Algeria", "Angola", "Benin", "Cameroon", "Chad", "Côte d'Ivoire",
  "Democratic Republic of the Congo", "Egypt", "Gabon", "Ghana", "Kenya",
  "Mali", "Morocco", "Mozambique", "Nigeria", "Rwanda", "Senegal",
  "South Africa", "Tanzania", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
]) {
  assert.ok(choices.includes(\`value: "\${country}"\`));
}

console.log("STEP 09 INTERNATIONAL PHONE + OTP FLOW STATIC CERTIFICATION: PASS");
console.log("Covered: single-source phone collection, international E.164-compatible validation and normalization, no country-specific phone default, explicit SMS channel, server persistence, OTP linkage, and African country coverage.");
