import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const file = readFileSync("src/features/admin/components/AdminCustomersTable.tsx", "utf8");
assert.match(file, /View|Voir/);
assert.match(file, /setDetails\(customer\)/);
assert.match(file, /canManage/);
assert.match(file, /disabled=\{customer\.lifecycleState === "SUSPENDED"\}/);
assert.match(file, /At least 8 characters|Au moins 8 caractères/);
assert.match(file, /CheckCircle2/);
assert.match(file, /XCircle/);
assert.match(file, /Customer details|Détails du client/);
console.log("Step 10 admin customer controls certification: PASS");
