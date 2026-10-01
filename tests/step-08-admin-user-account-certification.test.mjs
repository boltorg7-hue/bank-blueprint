import assert from "node:assert/strict";
import fs from "node:fs";

const root = process.cwd();
const read = (path) => fs.readFileSync(root + "/" + path, "utf8");

const functions = read("src/features/admin/services/admin.functions.ts");
const server = read("src/features/admin/services/admin.server.ts");
const hook = read("src/features/admin/hooks/useAdmin.ts");
const customers = read("src/features/admin/components/AdminCustomersTable.tsx");
const accounts = read("src/features/admin/components/AdminAccountsTable.tsx");
const migration = read("supabase/migrations/20260924080000_admin_stage1_hardening.sql");
const adminTypes = read("src/features/admin/types/admin.ts");

assert.match(functions, /listAdminCustomers/);
assert.match(functions, /listAdminAccounts/);
assert.match(functions, /setCustomerState/);
assert.match(functions, /setAccountStatus/);
assert.match(functions, /requireAdminPermission\(context\.supabase, "customers\.write"\)/);
assert.match(functions, /requireAdminPermission\(context\.supabase, "accounts\.manage"\)/);

assert.match(server, /requireAdminPermission\(client, "customers\.read"\)/);
assert.match(server, /requireAdminPermission\(client, "accounts\.read"\)/);
assert.match(server, /from\("profiles"\)/);
assert.match(server, /from\("bank_accounts"\)/);
assert.match(server, /from\("account_balances"\)/);
assert.match(server, /lifecycle_state/);
assert.match(server, /available_balance_minor/);
assert.match(server, /held_balance_minor/);

assert.match(hook, /useAdminCustomers/);
assert.match(hook, /useAdminAccounts/);
assert.match(hook, /useSetCustomerState/);
assert.match(hook, /useSetAccountStatus/);
assert.match(hook, /customers\.write/);
assert.match(hook, /accounts\.manage/);

assert.match(customers, /Restrict|Restreindre/);
assert.match(customers, /Suspend|Suspendre/);
assert.match(customers, /Reactivate|Réactiver/);
assert.match(customers, /reason\.trim\(\)\.length < 8/);
assert.match(accounts, /Freeze|Geler/);
assert.match(accounts, /Reactivate|Réactiver/);
assert.match(accounts, /ledgerBalanceMinor/);
assert.match(accounts, /availableBalanceMinor/);
assert.match(accounts, /heldBalanceMinor/);

assert.match(migration, /role_permissions/);
assert.match(migration, /customers\.write/);
assert.match(migration, /accounts\.manage/);
assert.match(migration, /CREATE OR REPLACE FUNCTION public\.admin_set_customer_state/);
assert.match(migration, /CREATE OR REPLACE FUNCTION public\.admin_set_account_status/);
assert.match(migration, /has_permission\(auth\.uid\(\), 'customers\.write'\)/);
assert.match(migration, /has_permission\(auth\.uid\(\), 'accounts\.manage'\)/);
assert.match(migration, /account required before activation/);
assert.match(migration, /closed account immutable/);
assert.match(migration, /account_status_history/);
assert.match(migration, /admin_audit_events/);
assert.match(migration, /REVOKE ALL ON FUNCTION public\.admin_set_customer_state/);
assert.match(migration, /REVOKE ALL ON FUNCTION public\.admin_set_account_status/);
assert.match(adminTypes, /AdminCustomerDto/);
assert.match(adminTypes, /AdminAccountDto/);

console.log("Step 08 static certification: PASS");
