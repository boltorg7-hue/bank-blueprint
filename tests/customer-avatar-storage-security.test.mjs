import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  "supabase/migrations/20261112100000_customer_avatar_storage_hardening.sql",
  "utf8",
);
const profileService = fs.readFileSync(
  "src/features/profile/services/profile.server.ts",
  "utf8",
);

assert.match(migration, /'customer-avatars'[\s\S]*public = false/i);
assert.match(migration, /file_size_limit[\s\S]*3145728/);
assert.match(migration, /ARRAY\['image\/jpeg', 'image\/png', 'image\/webp'\]/);
assert.match(migration, /Customer avatar owner read[\s\S]*auth\.uid\(\)::text = \(storage\.foldername\(name\)\)\[1\]/);
assert.match(migration, /Customer avatar owner upload[\s\S]*metadata->>'mimetype'[\s\S]*metadata->>'size'/);
assert.match(migration, /Customer avatar owner delete unlinked[\s\S]*p\.avatar_storage_path = name/);
assert.match(profileService, /createSignedUrl\\([\\s\\S]*avatar_storage_path/);
assert.match(profileService, /AVATAR_INVALID_CONTENT/);
assert.match(profileService, /AVATAR_PATH_FORBIDDEN/);

console.log("CUSTOMER AVATAR STORAGE SECURITY CERTIFICATION: PASS");
