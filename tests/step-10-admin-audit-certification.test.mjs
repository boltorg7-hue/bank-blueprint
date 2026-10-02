import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const server = readFileSync("src/features/admin/services/admin.server.ts", "utf8");
const functions = readFileSync("src/features/admin/services/admin.functions.ts", "utf8");
const hook = readFileSync("src/features/admin/hooks/useAdmin.ts", "utf8");
const route = readFileSync("src/routes/admin.audit.tsx", "utf8");
const nav = readFileSync("src/config/navigation.ts", "utf8");

assert.match(server, /requireAdminPermission\(client, "audit\.read"\)/);
assert.match(server, /admin_audit_events/);
assert.match(server, /AUDIT_UNAVAILABLE/);
assert.match(functions, /listAdminAuditEvents/);
assert.match(hook, /audit\.read/);
assert.match(route, /AdminGate permission="audit\.read"/);
assert.match(route, /Search audit events|Rechercher dans l’audit/);
assert.match(nav, /\/admin\/audit/);

console.log("Step 10 admin audit certification: PASS");
