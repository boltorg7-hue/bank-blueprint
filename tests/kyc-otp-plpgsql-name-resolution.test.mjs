import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261112150000_kyc_otp_plpgsql_name_resolution.sql",
  "utf8",
);

// The KYC decision functions write to this column. The original table
// definition did not include it, so the forward migration must add it.
assert.match(
  migration,
  /ALTER TABLE public\\.verification_documents[\\s\\S]*ADD COLUMN IF NOT EXISTS reviewed_at timestamptz/i,
);

// RETURNS TABLE creates PL/pgSQL output variables named status and phone.
// Every corresponding table-column reference in predicates must be qualified.
assert.match(
  migration,
  /RETURNS TABLE\\(status public\\.identity_verification_status, already_submitted boolean\\)/,
);
assert.match(
  migration,
  /FROM public\\.verification_documents AS vd[\\s\\S]*vd\\.status = 'UPLOADED'/,
);
assert.match(
  migration,
  /RETURNS TABLE\\(notification_id uuid, phone text, expires_at timestamptz\\)/,
);
assert.match(
  migration,
  /FROM public\\.phone_verification_codes AS pvc[\\s\\S]*pvc\\.phone = _profile\\.phone/,
);
assert.doesNotMatch(migration, /WHERE\\s+status\\s*=/i);
assert.doesNotMatch(migration, /WHERE\\s+phone\\s*=/i);
assert.match(
  migration,
  /REVOKE ALL ON FUNCTION public\\.customer_submit_onboarding_for_verification\\(uuid\\)[\\s\\S]*GRANT EXECUTE ON FUNCTION public\\.customer_submit_onboarding_for_verification\\(uuid\\)\\s+TO service_role/i,
);
assert.match(
  migration,
  /REVOKE ALL ON FUNCTION public\\.customer_create_phone_verification\\(uuid, text, jsonb, timestamptz\\)[\\s\\S]*GRANT EXECUTE ON FUNCTION public\\.customer_create_phone_verification\\(uuid, text, jsonb, timestamptz\\)\\s+TO service_role/i,
);

console.log("KYC/OTP PLPGSQL NAME-RESOLUTION CERTIFICATION: PASS");
