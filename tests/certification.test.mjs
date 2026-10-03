import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const stepMigrations = readdirSync(new URL("supabase/migrations/", root))
  .filter((name) => /^20260924.*\.sql$/.test(name))
  .map((name) => ({ name, sql: read(`supabase/migrations/${name}`) }));

test("les migrations des étapes 1 à 6 sont présentes dans l’ordre", () => {
  assert.deepEqual(stepMigrations.map(({ name }) => name), [
    "20260924080000_admin_stage1_hardening.sql",
    "20260924090000_customer_profile_preferences.sql",
    "20260924110000_simulated_external_admin_workflow.sql",
    "20260924120000_customer_support_messaging.sql",
    "20260924130000_customer_security_center.sql",
  ]);
});

test("chaque fonction SECURITY DEFINER ajoutée fixe son search_path", () => {
  for (const { name, sql } of stepMigrations) {
    const declarations = sql.match(/CREATE OR REPLACE FUNCTION[\s\S]*?AS \$\$/g) ?? [];
    for (const declaration of declarations) {
      if (declaration.includes("SECURITY DEFINER")) {
        assert.match(declaration, /SET search_path\s*(?:=|TO)?\s*'?public'?/i, name);
      }
    }
  }
});

test("les nouvelles tables client activent RLS", () => {
  const sql = stepMigrations.map(({ sql }) => sql).join("\n");
  for (const table of ["customer_preferences", "notifications", "notification_outbox", "support_threads", "support_messages", "customer_security_sessions", "customer_security_events", "security_step_up_grants"]) {
    assert.match(sql, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, "i"), table);
  }
});

test("les tables sensibles ne donnent aucune écriture directe au navigateur", () => {
  const sql = stepMigrations.map(({ sql }) => sql).join("\n");
  for (const table of ["notification_outbox", "support_threads", "support_messages", "customer_security_sessions", "customer_security_events", "security_step_up_grants"]) {
    assert.doesNotMatch(sql, new RegExp(`GRANT (?:ALL|INSERT|DELETE).*${table}.*authenticated`, "i"), table);
  }
});

test("les jalons externes restent 90, 95, 99 et 100", () => {
  const migration = read("supabase/migrations/20260827161315_e10a7d78-812a-4cc4-b1ab-5c0cc9f06f70.sql");
  assert.match(migration, /FINAL_REVIEW[^\n]*THEN 90/);
  assert.match(migration, /APPROVED[^\n]*THEN 95/);
  assert.match(migration, /SETTLEMENT_PENDING[^\n]*THEN 99/);
  assert.match(migration, /COMPLETED[^\n]*THEN 100/);
});

test("un virement exige et consomme un step-up avant le service privilégié", () => {
  const fn = read("src/features/transfers/services/transfers.functions.ts");
  const consume = fn.indexOf("consume_security_step_up");
  const execute = fn.indexOf("service.confirmTransfer", consume);
  assert.ok(consume >= 0 && execute > consume);
  assert.match(fn, /RECENT_AUTHENTICATION_REQUIRED/);
});

test("aucun composant ou route n’importe le client Supabase service-role", () => {
  for (const directory of ["src/components", "src/routes"]) {
    const walk = (path) => {
      for (const entry of readdirSync(new URL(`${path}/`, root), { withFileTypes: true })) {
        const child = join(path, entry.name);
        if (entry.isDirectory()) walk(child);
        else if (/\.(?:ts|tsx)$/.test(entry.name)) assert.doesNotMatch(read(child), /client\.server/, child);
      }
    };
    walk(directory);
  }
});

test("la messagerie est uniquement client vers service client", () => {
  const migration = read("supabase/migrations/20260924120000_customer_support_messaging.sql");
  assert.match(migration, /customer_user_id=auth\.uid\(\)/);
  assert.match(migration, /has_permission\(auth\.uid\(\),'support\.reply'\)/);
  assert.doesNotMatch(migration, /recipient_user_id/);
});

test("les hooks React Query admin utilisent uniquement une politique centralisée", () => {
  const adminHooks = read("src/features/admin/hooks/useAdmin.ts");
  assert.doesNotMatch(adminHooks, /ADMIN_OPERATIONAL_STALE_MS/);
  assert.doesNotMatch(adminHooks, /\bstaleTime\s*:/);
  assert.match(adminHooks, /\.\.\.QUERY_POLICY\.REALTIME/);
});


test("les collections admin Customers et Accounts utilisent un curseur serveur stable", () => {
  const server = read("src/features/admin/services/admin.server.ts");
  const functions = read("src/features/admin/services/admin.functions.ts");
  const hooks = read("src/features/admin/hooks/useAdmin.ts");
  assert.match(server, /loadAdminCustomers[\\s\\S]*?decodeAdminCursor\\(cursor\\)/);
  assert.match(server, /loadAdminAccounts[\\s\\S]*?decodeAdminCursor\\(cursor\\)/);
  assert.doesNotMatch(server, /loadAdminCustomers[\\s\\S]*?\\.range\\(/);
  assert.doesNotMatch(server, /loadAdminAccounts[\\s\\S]*?\\.limit\\(100\\)/);
  assert.match(functions, /listAdminCustomers[\\s\\S]*?data\\.cursor/);
  assert.match(functions, /listAdminAccounts[\\s\\S]*?data\\.cursor/);
  assert.match(hooks, /useAdminCustomers\\(search: string, cursor/);
  assert.match(hooks, /useAdminAccounts\\(search = \\"\\", cursor/);
});


test("les collections admin Funding, Audit et External Transfers utilisent une pagination curseur", () => {
  const server = read("src/features/admin/services/admin.server.ts");
  const functions = read("src/features/admin/services/admin.functions.ts");
  assert.match(server, /loadFundingRequests[\\s\\S]*?decodeAdminCursor\\(cursor\\)/);
  assert.match(server, /loadAdminAuditEvents[\\s\\S]*?decodeAdminCursor\\(cursor\\)/);
  assert.match(server, /loadExternalTransfers[\\s\\S]*?decodeAdminCursor\\(cursor\\)/);
  for (const name of ["loadFundingRequests", "loadAdminAuditEvents", "loadExternalTransfers"]) {
    const start = server.indexOf(`export async function ${name}`);
    const end = server.indexOf("export async function ", start + 20);
    const body = server.slice(start, end < 0 ? server.length : end);
    assert.doesNotMatch(body, /\\.limit\\(100\\)/, name);
    assert.match(body, /limit\\(ADMIN_PAGE_SIZE \\+ 1\\)/, name);
  }
  assert.match(functions, /listFundingRequests[\\s\\S]*?data\\.cursor/);
  assert.match(functions, /listAdminExternalTransfers[\\s\\S]*?data\\.cursor/);
  assert.match(functions, /listAdminAuditEvents[\\s\\S]*?data\\.cursor/);
});

test("le funding ne dépend plus de la collection Accounts paginée", () => {
  const server = read("src/features/admin/services/admin.server.ts");
  const functions = read("src/features/admin/services/admin.functions.ts");
  const hooks = read("src/features/admin/hooks/useAdmin.ts");
  const ui = read("src/features/admin/components/FundingConsole.tsx");
  assert.match(server, /searchFundingAccounts[\\s\\S]*?\.eq\("status", "ACTIVE"\)/);
  assert.match(server, /searchFundingAccounts[\\s\\S]*?\.limit\(20\)/);
  assert.match(functions, /searchFundingAccounts/);
  assert.match(hooks, /useFundingAccountSearch/);
  assert.doesNotMatch(ui, /useAdminAccounts/);
});

test("Onboarding utilise recherche, statut et pagination serveur", () => {
  const server = read("src/features/admin/services/admin.server.ts");
  const functions = read("src/features/admin/services/admin.functions.ts");
  const hooks = read("src/features/admin/hooks/useAdmin.ts");
  const route = read("src/routes/admin.onboarding-cases.tsx");
  assert.match(server, /loadAdminOnboardingCases[\\s\\S]*?decodeAdminCursor\\(cursor\\)/);
  assert.match(server, /loadAdminOnboardingCases[\\s\\S]*?limit\\(ADMIN_PAGE_SIZE \\+ 1\\)/);
  assert.doesNotMatch(server, /loadAdminOnboardingCases[\\s\\S]*?\\.limit\\(100\\)/);
  assert.match(functions, /onboardingSearchInput/);
  assert.match(functions, /listAdminOnboardingCases[\\s\\S]*?data\\.cursor/);
  assert.match(hooks, /useAdminOnboardingCases\\(search: string, status = "ALL", cursor/);
  assert.doesNotMatch(route, /useMemo|\\.filter\\(\\(item\\) => item\\.verificationStatus/);
  assert.match(route, /query\\.data\\.hasNext/);
});

test("l'historique transactions utilise un curseur serveur", () => {
  const server = read("src/features/transactions/services/transactions.server.ts");
  const types = read("src/features/transactions/types/transaction.ts");
  const ui = read("src/features/transactions/components/TransactionHistory.tsx");
  assert.match(server, /decodeTransactionCursor\\(request.cursor\\)/);
  assert.match(server, /limit\\(pageSize \\+ 1\\)/);
  assert.doesNotMatch(server, /getTransactions[\\s\\S]*?\\.range\\(/);
  assert.doesNotMatch(server, /getTransactions[\\s\\S]*?count: "exact"/);
  assert.match(types, /cursor\\?: string \\| null/);
  assert.match(ui, /cursorHistory/);
  assert.doesNotMatch(ui, /totalCount|totalPages/);
});

test("documents et support utilisent la pagination serveur", () => {
  const documents = read("src/features/documents/services/documents.server.ts");
  const documentUi = read("src/features/documents/components/DocumentList.tsx");
  const support = read("src/features/support/services/support.server.ts");
  const supportUi = read("src/features/support/components/SupportCenter.tsx");
  const adminSupportUi = read("src/features/support/components/AdminSupportConsole.tsx");
  assert.match(documents, /decodeDocumentCursor\\(options.cursor\\)/);
  assert.match(documents, /limit\\(DOCUMENT_PAGE_SIZE \\+ 1\\)/);
  assert.doesNotMatch(documents, /listDocuments[\\s\\S]*?\\.limit\\(40\\)/);
  assert.match(documentUi, /hasNext/);
  assert.match(support, /decodeSupportCursor\\(cursor\\)/);
  assert.match(support, /SUPPORT_PAGE_SIZE \\+ 1/);
  assert.doesNotMatch(support, /loadAdminSupport[\\s\\S]*?\\.limit\\(100\\)/);
  assert.match(support, /messagesByThread/);
  assert.doesNotMatch(support, /messages.*\\.filter\\(.*thread_id/);
  assert.match(supportUi, /useCustomerSupport\\(cursor\\)/);
  assert.match(adminSupportUi, /useAdminSupport\\(cursor\\)/);
});

test("notifications utilise pagination et filtre serveur", () => {
  const server = read("src/features/notifications/services/notifications.server.ts");
  const ui = read("src/features/notifications/components/NotificationCenter.tsx");
  assert.match(server, /decodeNotificationCursor\\(options.cursor\\)/);
  assert.match(server, /NOTIFICATION_PAGE_SIZE\\+1/);
  assert.match(server, /category!=="ALL"/);
  assert.match(ui, /useNotifications\\(filter, cursor\\)/);
  assert.doesNotMatch(ui, /q\\.data\\?\\.items \\?\\? \\[\\]\\)\\.filter/);
});

test("la matrice DB certifie la version finale des fonctions", () => {
  const audit = read("scripts/audit-migration-functions.mjs");
  assert.match(audit, /entry\.finalDefinition = match\[0\]/);
  assert.match(audit, /entry\.securityDefiner = \/SECURITY\\s\+DEFINER/);
  assert.match(audit, /entry\.searchPath = \/search_path/);
  assert.doesNotMatch(audit, /securityDefiner \\|\\|=/);
  assert.doesNotMatch(audit, /searchPath \\|\\|=/);
});


test("les policies sensibles ne peuvent pas ouvrir une surface anon/public et les lectures authenticated sont bornées", () => {
  const sql = read("supabase/tests/full_security_certification.sql");
  assert.match(sql, /SENSITIVE_POLICY_EXPOSES_ANON_OR_PUBLIC/);
  assert.match(sql, /AUTHENTICATED_POLICY_NOT_SCOPED/);
  assert.match(sql, /auth\\\\\.uid/);
  assert.match(sql, /has_permission/);
  assert.match(sql, /is_staff/);
});
