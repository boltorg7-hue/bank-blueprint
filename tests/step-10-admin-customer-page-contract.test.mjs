import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const file = readFileSync("supabase/migrations/20261004100000_admin_customer_page_contract.sql", "utf8");

const expectedColumns = [
  "id uuid",
  "first_name text",
  "middle_name text",
  "last_name text",
  "phone text",
  "lifecycle_state text",
  "created_at timestamptz",
  "account_count integer",
  "attention_reasons text[]",
  "attention_count integer",
  "oldest_attention_at timestamptz",
];

const returnColumns = file.match(/returns table \(([^;]+?)\)\nlanguage sql/s)?.[1] ?? "";
assert.ok(returnColumns, "admin_customer_page return contract is missing");

for (const column of expectedColumns) {
  assert.ok(returnColumns.includes(column), `expected return column is missing: ${column}`);
}

const reasonOrder = [
  "LIFECYCLE",
  "KYC",
  "DOCUMENTS",
  "NOTIFICATIONS",
  "TRANSFERS",
  "FUNDING",
];

const reasonPositions = reasonOrder.map((reason) => file.indexOf(`then '${reason}'`));
assert.ok(reasonPositions.every((position) => position >= 0), "all attention reasons must be present");
assert.ok(
  reasonPositions.every((position, index) => index === 0 || position > reasonPositions[index - 1]),
  "attention reasons must have deterministic order",
);

assert.match(file, /cardinality\(f\.computed_attention_reasons\)::integer as attention_count/);
assert.match(file, /p_attention_filter = 'NEEDS_ATTENTION'/);
assert.match(file, /p_attention_filter = 'CLEAR'/);
assert.match(file, /order by c\.created_at desc, c\.id desc/);
assert.match(file, /limit greatest\(1, least\(p_limit, 51\)\)/);

assert.match(file, /fr\.status = 'PENDING'/);
assert.match(file, /n\.archived_at is null/);
assert.match(file, /n\.read_at is null/);
assert.match(file, /t\.status in \(\s*'PROCESSING'/s);
assert.match(file, /vd\.status in \('ACTION_REQUIRED', 'REJECTED', 'EXPIRED'\)/);
assert.match(file, /iv\.status in \(\s*'UNDER_REVIEW',\s*'ADDITIONAL_INFORMATION_REQUIRED',\s*'REJECTED'/s);

console.log("Admin customer page contract certification: PASS");
