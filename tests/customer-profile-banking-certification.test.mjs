import assert from "node:assert/strict";
import fs from "node:fs";

const profilePage = fs.readFileSync("src/features/profile/components/ProfilePage.tsx", "utf8");
const profileTypes = fs.readFileSync("src/features/profile/types/profile.ts", "utf8");
const profileService = fs.readFileSync("src/features/profile/services/profile.server.ts", "utf8");
const profileFunctions = fs.readFileSync("src/features/profile/services/profile.functions.ts", "utf8");
const accountService = fs.readFileSync("src/features/accounts/services/accounts.server.ts", "utf8");
const accountFunctions = fs.readFileSync("src/features/accounts/services/accounts.functions.ts", "utf8");

assert.match(profilePage, /to="\/app\/accounts\/\$accountRef"/);
assert.match(profilePage, /params=\{\{ accountRef: account\.reference \}\}/);
assert.doesNotMatch(profilePage, /account\.iban|account\.bic/);
assert.doesNotMatch(profileTypes, /iban: string \| null|bic: string \| null/);
assert.match(profileService, /public_reference,display_name,currency,status,account_number/);
assert.doesNotMatch(profileService, /account\.iban|account\.bic/);
assert.match(profileFunctions, /loadProfile\(\s*context\.userId/);
assert.match(accountService, /eq\("user_id", userId\)[\s\S]*?eq\("public_reference", reference\)/);
assert.match(accountFunctions, /middleware\(\[requireSupabaseAuth\]\)/);

console.log("CUSTOMER PROFILE BANKING CERTIFICATION: PASS");
