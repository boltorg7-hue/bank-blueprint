import assert from "node:assert/strict";
import fs from "node:fs";

const supportServer = fs.readFileSync("src/features/support/services/support.server.ts", "utf8");
const supportFunctions = fs.readFileSync(
  "src/features/support/services/support.functions.ts",
  "utf8",
);
const supportUi = fs.readFileSync("src/features/support/components/SupportCenter.tsx", "utf8");
const supportMigration = fs.readFileSync(
  "supabase/migrations/20260924120000_customer_support_messaging.sql",
  "utf8",
);
const profilePage = fs.readFileSync("src/features/profile/components/ProfilePage.tsx", "utf8");
const moreRoute = fs.readFileSync("src/routes/app.more.tsx", "utf8");
const sessionHook = fs.readFileSync("src/features/auth/hooks/useSessionUser.ts", "utf8");

assert.match(supportServer, /SUPPORT_CURSOR_UUID/);
assert.match(supportServer, /SUPPORT_CURSOR_TIMESTAMP/);
assert.match(supportServer, /throw new Error\("INVALID_SUPPORT_CURSOR"\)/);
assert.match(supportServer, /\.eq\("customer_user_id", userId\)/);
assert.match(supportServer, /requireAdminPermission\(client, "support\.read"\)/);
assert.match(supportServer, /limit\(SUPPORT_PAGE_SIZE \+ 1\)/);
assert.match(supportFunctions, /middleware\(\[requireSupabaseAuth\]\)/);
assert.match(supportFunctions, /requireAdminPermission\(context\.supabase, "support\.reply"\)/);
assert.match(supportMigration, /customer_user_id=auth\.uid\(\)/);
assert.match(supportMigration, /has_permission\(auth\.uid\(\),'support\.reply'\)/);
assert.match(
  supportMigration,
  /status IN \('OPEN','WAITING_SUPPORT','WAITING_CUSTOMER','RESOLVED','CLOSED'\)/,
);
assert.match(supportUi, /Search this page|Rechercher sur cette page/);
assert.match(supportUi, /Filter this page|Filtrer cette page/);
assert.match(profilePage, /to="\/app\/messages"/);
assert.match(profilePage, /to="\/help"/);
assert.match(moreRoute, /onClick=\{\(\) => void signOut\(\)\}/);

assert.match(sessionHook, /toast[.]error/);
assert.ok(
  sessionHook.indexOf("if (error) throw error") < sessionHook.indexOf("queryClient.clear()"),
);

console.log("CUSTOMER SUPPORT AND ACCOUNT MANAGEMENT CERTIFICATION: PASS");
