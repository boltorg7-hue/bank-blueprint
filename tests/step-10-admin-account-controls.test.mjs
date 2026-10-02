import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const table = readFileSync("src/features/admin/components/AdminAccountsTable.tsx", "utf8");
const server = readFileSync("src/features/admin/services/admin.server.ts", "utf8");

assert.match(table, /status === "ACTIVE" \? "FROZEN" : "ACTIVE"/);
assert.match(table, /!\["ACTIVE", "FROZEN"\]\.includes\(account\.status\)/);
assert.match(table, /Au moins 8 caractères|At least 8 characters/);
assert.match(table, /CheckCircle2/);
assert.match(table, /XCircle/);
assert.match(table, /accounts\.manage/);
assert.match(server, /ACCOUNT_BALANCE_UNAVAILABLE/);
assert.match(server, /if \(!balance\)/);

console.log("Step 10 admin account controls certification: PASS");
