import assert from "node:assert/strict";
import fs from "node:fs";

const preferencesPage = fs.readFileSync(
  "src/features/profile/components/PreferencesPage.tsx",
  "utf8",
);
const preferencesService = fs.readFileSync(
  "src/features/profile/services/profile.server.ts",
  "utf8",
);
const preferencesFunctions = fs.readFileSync(
  "src/features/profile/services/profile.functions.ts",
  "utf8",
);
const preferencesSchema = fs.readFileSync(
  "src/features/profile/schemas/profile.schemas.ts",
  "utf8",
);
const privacyProvider = fs.readFileSync("src/components/providers/PrivacyModeProvider.tsx", "utf8");

assert.match(preferencesPage, /usePreferences\(\)/);
assert.match(preferencesPage, /useSavePreferences\(\)/);
assert.match(preferencesPage, /setTheme\(query\.data\.theme\)/);
assert.match(preferencesPage, /setLanguage\(query\.data\.language\)/);
assert.match(preferencesPage, /setPrivacyMode\(query\.data\.privacyModeDefault\)/);
assert.match(preferencesPage, /setPrivacyMode\(result\.privacyModeDefault\)/);
assert.match(preferencesPage, /disabled=\{save\.isPending \|\| !hasChanges\}/);
assert.match(preferencesFunctions, /middleware\(\[requireSupabaseAuth\]\)/);
assert.match(preferencesService, /eq\("user_id", userId\)/);
assert.match(
  preferencesService,
  /if \(error\) throw new ProfileError\("PREFERENCES_UNAVAILABLE"\)/,
);
assert.match(preferencesService, /upsert\(payload, \{ onConflict: "user_id" \}\)/);
assert.match(preferencesSchema, /language: z\.enum\(\["fr", "en"\]\)/);
assert.match(preferencesSchema, /theme: z\.enum\(\["light", "dark", "system"\]\)/);
assert.match(privacyProvider, /localStorage\.setItem\(STORAGE_KEY/);

console.log("CUSTOMER PROFILE PREFERENCES CERTIFICATION: PASS");
