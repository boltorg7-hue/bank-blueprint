import assert from "node:assert/strict";
import fs from "node:fs";

const profilePage = fs.readFileSync("src/features/profile/components/ProfilePage.tsx", "utf8");
const personalPage = fs.readFileSync(
  "src/features/profile/components/ProfilePersonalPage.tsx",
  "utf8",
);
const addressPage = fs.readFileSync(
  "src/features/profile/components/ProfileAddressPage.tsx",
  "utf8",
);
const profileService = fs.readFileSync("src/features/profile/services/profile.server.ts", "utf8");
const onboardingSchemas = fs.readFileSync(
  "src/features/onboarding/schemas/onboarding.schemas.ts",
  "utf8",
);

assert.match(profilePage, /to="\/app\/profile\/personal"/);
assert.match(profilePage, /to="\/app\/profile\/address"/);
assert.doesNotMatch(profilePage, /useSaveProfile|useSaveAddress/);
assert.match(personalPage, /profileStepSchema\.safeParse\(form\)/);
assert.match(personalPage, /data\.identityLocked/);
assert.match(personalPage, /useSaveProfile/);
assert.match(addressPage, /addressStepSchema\.safeParse\(form\)/);
assert.match(addressPage, /useSaveAddress/);
assert.match(onboardingSchemas, /internationalPhoneSchema/);
assert.match(
  profileService,
  /const phoneChanged = \(currentProfile\.phone \?\? ""\) !== data\.phone/,
);
assert.match(profileService, /payload\.phone_verified_at = null/);
assert.match(profileService, /from\("customer_addresses"\)/);

console.log("CUSTOMER PROFILE PERSONAL AND ADDRESS CERTIFICATION: PASS");
