import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const file = readFileSync("src/routes/admin.customers.tsx", "utf8");

assert.match(file, /const customers = query\.data\?\.items \?\? \[\];/);
assert.doesNotMatch(
  file,
  /\.sort\(\(a, b\) =>[\s\S]*attentionCount[\s\S]*oldestAttentionAt/,
  "customer page must not reorder the server-paginated result by attention priority",
);
assert.match(file, /onClick=\{\(\) => \{ if \(!query\.data\?\.nextCursor\) return;/);
assert.match(file, /setCursor\(query\.data\.nextCursor\)/);
assert.match(file, /setCursorHistory\(\(items\) => \[\.\.\.items, cursor \?\? ""\]\)/);
assert.match(file, /setCursor\(previous\)/);
assert.match(file, /setCursor\(null\); setCursorHistory\(\[\]\)/);

console.log("Admin customer pagination UI certification: PASS");
