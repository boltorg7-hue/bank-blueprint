import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const file = readFileSync("src/features/admin/services/admin.server.ts", "utf8");
const start = file.indexOf("export async function loadAdminCustomers(");
const end = file.indexOf("export async function loadAdminOnboardingCases(", start);
assert.ok(start >= 0 && end > start, "loadAdminCustomers boundaries are missing");

const fn = file.slice(start, end);

assert.match(fn, /admin\.rpc\("admin_customer_page"/);
for (const parameter of [
  "p_search",
  "p_lifecycle",
  "p_accounts_filter",
  "p_attention_filter",
  "p_cursor_created_at",
  "p_cursor_id",
  "p_limit",
]) {
  assert.match(fn, new RegExp(parameter), `RPC parameter is missing: ${parameter}`);
}

assert.doesNotMatch(fn, /admin\.from\("profiles"\)/, "customer list must not query profiles directly");
assert.doesNotMatch(fn, /admin\.from\("bank_accounts"\)/, "account filtering/counts must not be rebuilt in TypeScript");
assert.doesNotMatch(fn, /attentionIds|inactiveProfiles|flaggedVerifications|verificationByUser|documentByUser|unreadByUser|openTransfersByUser|pendingFundingByUser/, "attention logic must remain in PostgreSQL");
assert.doesNotMatch(fn, /attentionCount\s*DESC|oldestAttentionAt\s*ASC|attentionReasons.*sort/, "client-side attention priority sorting must not override cursor order");

assert.match(fn, /accountCount:\s*Number\(row\.account_count/);
assert.match(fn, /attentionReasons:\s*Array\.isArray\(row\.attention_reasons\)/);
assert.match(fn, /attentionCount:\s*Number\(row\.attention_count/);
assert.match(fn, /oldestAttentionAt:\s*row\.oldest_attention_at/);
assert.match(fn, /reference:\s*`CUS-\${id\.replace/);
assert.match(fn, /fullName:\s*\[row\.first_name, row\.middle_name, row\.last_name\]/);
assert.match(fn, /loadAdminAuthEmails\(admin, ids\)/);
assert.match(fn, /encodeAdminCursor\(\{ createdAt: String\(last\.created_at\), id: String\(last\.id\) \}\)/);

console.log("Admin customer service migration certification: PASS");
