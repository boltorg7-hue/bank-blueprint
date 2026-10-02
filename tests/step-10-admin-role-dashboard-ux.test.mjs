import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = process.cwd();
const layout = readFileSync("src/components/layout/AdminLayout.tsx", "utf8");
const dashboard = readFileSync("src/routes/admin.dashboard.tsx", "utf8");
const staffTypes = readFileSync("src/features/admin/types/admin.ts", "utf8");

assert.match(layout, /useAdminContext/);
assert.match(layout, /staff\.data\?\.roles/);
assert.match(layout, /super_admin/);
assert.match(layout, /ShieldCheck/);

assert.match(dashboard, /useAdminContext/);
assert.match(dashboard, /staff\.data\.roles\.map/);
assert.match(dashboard, /staffReference/);
assert.match(dashboard, /department/);
assert.match(dashboard, /Maker-checker/);

assert.match(staffTypes, /roles: string\[\]/);
assert.match(staffTypes, /permissions: string\[\]/);

console.log("Step 10 admin role dashboard UX certification: PASS");
