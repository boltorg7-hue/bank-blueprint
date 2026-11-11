import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  "supabase/migrations/20261002120000_step10_kyc_notifications.sql",
  "utf8",
);
const hardening = readFileSync(
  "supabase/migrations/20261112110000_kyc_decision_integrity.sql",
  "utf8",
);

assert.match(sql, /service_review_identity_application/);
assert.match(sql, /kyc\\.info_required:/);
assert.match(sql, /service_decide_identity_application/);
assert.match(sql, /kyc\\.verified:/);
assert.match(sql, /kyc\\.rejected:/);
assert.match(sql, /kyc\\.review_returned:/);
assert.match(sql, /emit_customer_notification\\(/);
assert.match(sql, /has_permission\\(_actor_user_id,'kyc\\.review'\\)/);
assert.match(sql, /has_permission\\(_actor_user_id,'kyc\\.approve'\\)/);

assert.match(
  hardening,
  /status = 'REJECTED',[\\s\\S]*checker_user_id = _actor_user_id/,
);
assert.match(
  hardening,
  /document_type IN \\('IDENTITY_CARD', 'PASSPORT', 'RESIDENCE_PERMIT'\\)/,
);
assert.match(hardening, /document_type = 'PROOF_OF_ADDRESS'/);
assert.match(hardening, /status IN \\('UPLOADED', 'UNDER_REVIEW'\\)/);
assert.match(hardening, /status = 'ACCEPTED'/);
assert.match(hardening, /required identity and address documents missing/);
assert.match(hardening, /required accepted documents missing/);
assert.match(hardening, /has_permission\\(_actor_user_id, 'kyc\\.review'\\)/);
assert.match(hardening, /has_permission\\(_actor_user_id, 'kyc\\.approve'\\)/);
assert.match(hardening, /four-eyes approval required/);
assert.match(
  hardening,
  /GRANT EXECUTE ON FUNCTION public\\.service_decide_identity_application/,
);

console.log("Step 10 KYC notifications certification: PASS");
