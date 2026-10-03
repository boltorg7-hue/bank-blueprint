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


test("la matrice des migrations trie par timestamp même dans les sous-dossiers", () => {
  const audit = read("scripts/audit-migration-functions.mjs");
  assert.match(audit, /path\.basename\(a\)/);
  assert.match(audit, /path\.basename\(b\)/);
  assert.match(audit, /aName\.localeCompare\(bName\)/);
  assert.match(audit, /\\$\\$\[\\s\\S\]\*\?\\\\\$\\$/);
});


test("les migrations Supabase restent toutes dans le répertoire racine des migrations", () => {
  const migrationsDir = new URL("../supabase/migrations/", import.meta.url);
  const walk = (url, prefix = "") => {
    return readdirSync(url, { withFileTypes: true }).flatMap((entry) => {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) return walk(new URL(`${entry.name}/`, url), relative);
      return [relative];
    });
  };
  const paths = walk(migrationsDir);
  assert.ok(paths.includes("20260930210000_step01_customer_onboarding_hardening.sql"));
  assert.ok(paths.every((path) => !path.includes("/")));
});


test("la matrice des fonctions expose une empreinte de la définition finale et les grants signés", () => {
  const audit = read("scripts/audit-migration-functions.mjs");
  assert.match(audit, /finalDefinition/);
  assert.match(audit, /sha256/);
  assert.match(audit, /GRANT\s+EXECUTE\s+ON\s+FUNCTION/);
  assert.match(audit, /entry\.modifiedIn\.at\(-1\)/);
});

test("les index de production couvrent les parcours de pagination et recherche principaux", () => {
  const sql = read("supabase/migrations/20261003080000_performance_search_indexes.sql");
  for (const index of [
    "idx_profiles_created_at_id",
    "idx_profiles_lifecycle_created_at",
    "idx_bank_accounts_user_created",
    "idx_bank_accounts_created_at_id",
    "idx_transfers_sender_status_created",
    "idx_transfers_status_created",
    "idx_funding_requests_account_status_created",
    "idx_funding_requests_created_at_id",
    "idx_customer_documents_user_created",
    "idx_support_threads_last_message",
    "idx_notifications_user_unread",
    "idx_admin_audit_events_created",
    "idx_account_status_history_account_created"
  ]) {
    assert.match(sql, new RegExp(`create index if not exists ${index}`, "i"), index);
  }
  assert.match(sql, /using gin \(first_name extensions\.gin_trgm_ops\)/i);
  assert.match(sql, /using gin \(last_name extensions\.gin_trgm_ops\)/i);
});


test("le shell mobile respecte le contrat tactile et les safe areas", () => {
  const styles = read("src/styles.css");
  const bottomNav = read("src/components/navigation/CustomerBottomNav.tsx");
  const bankingLayout = read("src/components/layout/BankingAppLayout.tsx");
  assert.match(styles, /touch-action:\s*manipulation/);
  assert.match(styles, /-webkit-tap-highlight-color:\s*transparent/);
  assert.match(styles, /overflow-x:\s*hidden/);
  assert.match(bottomNav, /safe-pb/);
  assert.match(bottomNav, /min-h-16/);
  assert.match(bottomNav, /touch-target/);
  assert.match(bankingLayout, /pb-mobile-nav/);
  assert.match(bankingLayout, /min-h-dvh-safe/);
});

test("les primitives de dialogue conservent une fermeture tactile de 44px minimum", () => {
  for (const file of ["src/components/ui/dialog.tsx", "src/components/ui/sheet.tsx"]) {
    const source = read(file);
    assert.match(source, /flex size-11 items-center justify-center/);
    assert.match(source, /touch-target/);
  }
});

test("la navigation secondaire garde Plus actif sans voler l’état aux parcours primaires", () => {
  const navigation = read("src/config/navigation.ts");
  const bottomNav = read("src/components/navigation/CustomerBottomNav.tsx");
  const more = read("src/routes/app.more.tsx");

  assert.match(navigation, /export function isCustomerMoreRoute/);
  for (const route of [
    "/app/more",
    "/app/beneficiaries",
    "/app/statements",
    "/app/documents",
    "/app/messages",
    "/app/notifications",
    "/app/profile",
    "/app/security",
    "/app/settings",
  ]) {
    assert.match(navigation, new RegExp('"' + route.replace(/[.*+?^$()|[\]\\]/g, "\\test("la navigation mobile client reste limitée à cinq destinations primaires", () => {") + '"'));
  }
  assert.match(bottomNav, /isCustomerMoreRoute\(pathname\)/);
  assert.match(more, /aria-current=\{pathname === item\.to \|\| pathname\.startsWith\(item\.to \+ "\/"\) \? "page" : undefined\}/);
});

test("la navigation mobile client reste limitée à cinq destinations primaires", () => {
  const navigation = read("src/config/navigation.ts");
  const match = navigation.match(/export const CUSTOMER_PRIMARY_NAV[\s\S]*?\];/);
  assert.ok(match);
  const entries = match[0].match(/\{ label:/g) ?? [];
  assert.ok(entries.length <= 5);

  const bottomNav = read("src/components/navigation/CustomerBottomNav.tsx");
  assert.match(bottomNav, /item\.to === "\/app\/more"/);
  assert.match(bottomNav, /pathname\.startsWith\("\/app\/transactions"\)/);
});


test("les primitives UI partagent une grammaire visuelle et tactile cohérente", () => {
  const input = read("src/components/ui/input.tsx");
  const textarea = read("src/components/ui/textarea.tsx");
  const select = read("src/components/ui/select.tsx");
  const tabs = read("src/components/ui/tabs.tsx");
  const badge = read("src/components/ui/badge.tsx");
  const form = read("src/components/ui/form.tsx");

  for (const source of [input, textarea]) {
    assert.match(source, /bg-surface/);
    assert.match(source, /focus-visible:ring-2 focus-visible:ring-ring/);
  }
  assert.match(select, /min-h-11/);
  assert.match(select, /focus:ring-2 focus:ring-ring/);
  assert.match(select, /min-h-11 w-full cursor-default/);
  assert.match(tabs, /min-h-11 items-center/);
  assert.match(tabs, /min-h-9 items-center/);
  for (const tone of ["success", "warning", "info", "danger"]) {
    assert.match(badge, new RegExp(tone + ":"));
  }
  assert.match(form, /text-body-sm text-muted-foreground/);
  assert.match(form, /text-body-sm font-medium text-destructive/);
});


test("les écrans métier principaux conservent une composition mobile-first", () => {
  const dashboard = read("src/routes/app.dashboard.tsx");
  const history = read("src/features/transactions/components/TransactionHistory.tsx");
  const transfer = read("src/features/transfers/components/TransferWizard.tsx");
  const profile = read("src/features/profile/components/ProfilePage.tsx");
  const security = read("src/features/security/components/SecurityCenter.tsx");
  const support = read("src/features/support/components/SupportCenter.tsx");
  const stepper = read("src/components/ui/stepper.tsx");

  assert.match(dashboard, /grid gap-3 sm:grid-cols-\[minmax\(0,1fr\)_auto\]/);
  assert.match(dashboard, /grid gap-3 md:grid-cols-2/);
  assert.match(history, /lg:hidden/);
  assert.match(history, /hidden lg:block/);
  assert.match(transfer, /w-full sm:w-auto/);
  assert.match(profile, /w-full sm:w-auto/);
  assert.match(security, /flex-col items-start gap-2 sm:flex-row/);
  assert.match(support, /flex flex-col gap-2 sm:flex-row/);
  assert.match(support, /SelectTrigger/);
  assert.match(stepper, /sm:hidden/);
  assert.match(stepper, /text-caption/);
});

test("le tableau financier bascule vers une liste mobile au lieu de forcer un tableau étroit", () => {
  const history = read("src/features/transactions/components/TransactionHistory.tsx");
  const list = read("src/features/transactions/components/TransactionList.tsx");
  const table = read("src/features/transactions/components/TransactionTable.tsx");
  assert.match(history, /<TransactionList/);
  assert.match(history, /<TransactionTable/);
  assert.match(list, /native-list/);
  assert.match(table, /overflow-hidden rounded-xl border/);
});


test("le socle tactile 5.5 conserve des zones d'action d'au moins 44px", () => {
  const dropdown = read("src/components/ui/dropdown-menu.tsx");
  const command = read("src/components/ui/command.tsx");
  const sheet = read("src/components/ui/sheet.tsx");
  const dialog = read("src/components/ui/dialog.tsx");
  assert.match(dropdown, /min-h-11/);
  assert.match(command, /min-h-11/);
  assert.match(command, /h-12 w-full/);
  assert.match(sheet, /safe-pb/);
  assert.match(dialog, /size-11/);
});

test("les actions financières critiques ont un verrou local contre le double-submit", () => {
  const transfer = read("src/features/transfers/components/TransferWizard.tsx");
  assert.match(transfer, /initiateLock = useRef\(false\)/);
  assert.match(transfer, /confirmLock = useRef\(false\)/);
  assert.match(transfer, /loading=\{initiate\.isPending\}/);
  assert.match(transfer, /loading=\{confirm\.isPending\}/);
  assert.match(transfer, /onSettled: \(\) => \{\s*initiateLock\.current = false;/);
  assert.match(transfer, /onSettled: \(\) => \{\s*confirmLock\.current = false;/);
});


test("la performance frontend réserve le realtime aux données opérationnelles", () => {
  const admin = read("src/features/admin/hooks/useAdmin.ts");
  const notifications = read("src/features/notifications/hooks/useNotifications.ts");
  const router = read("src/router.tsx");

  const auditStart = admin.indexOf("export function useAdminAudit");
  const auditEnd = admin.indexOf("export function useAdminAccountStatusHistory", auditStart);
  const auditHook = admin.slice(auditStart, auditEnd);

  const historyStart = admin.indexOf("export function useAdminAccountStatusHistory");
  const dossierStart = admin.indexOf("export function useAdminCustomerDossier", historyStart);
  const historyHook = admin.slice(historyStart, dossierStart);

  const dossierHook = admin.slice(dossierStart);

  assert.match(auditHook, /\.\.\.QUERY_POLICY\.NORMAL/);
  assert.match(historyHook, /\.\.\.QUERY_POLICY\.NORMAL/);
  assert.match(dossierHook, /\.\.\.QUERY_POLICY\.NORMAL/);
  assert.match(admin, /useFundingRequests[\s\S]*?\.\.\.QUERY_POLICY\.REALTIME/);
  assert.match(admin, /useAdminExternalTransfers[\s\S]*?\.\.\.QUERY_POLICY\.REALTIME/);
  assert.match(notifications, /\.\.\.QUERY_POLICY\.REALTIME/);
  assert.doesNotMatch(notifications, /refetchInterval\s*:/);
  assert.match(router, /defaultPreloadStaleTime:\s*30_000/);
});


test("les listes métier évitent les rerenders inutiles et conservent une hiérarchie DOM cohérente", () => {
  const dashboard = read("src/routes/app.dashboard.tsx");
  const documents = read("src/features/documents/components/DocumentList.tsx");
  const support = read("src/features/support/components/SupportCenter.tsx");

  assert.equal((dashboard.match(/aria-labelledby="accounts-heading"/g) ?? []).length, 1);
  assert.equal((dashboard.match(/aria-labelledby="activity-heading"/g) ?? []).length, 1);
  assert.match(documents, /import \{ memo, useState \} from "react"/);
  assert.match(documents, /const DocumentRow = memo\(function DocumentRow/);
  assert.match(support, /import \{ memo, useState \} from "react"/);
  assert.match(support, /const CustomerThread = memo\(function CustomerThread/);
});


test("les écrans admin lourds chargent leurs tableaux métier à la demande", () => {
  const routes = [
    ["src/routes/admin.accounts.tsx", "AdminAccountsTable"],
    ["src/routes/admin.customers.tsx", "AdminCustomersTable"],
    ["src/routes/admin.funding.tsx", "FundingConsole"],
    ["src/routes/admin.onboarding-cases.tsx", "AdminOnboardingCases"],
  ];

  for (const [path, component] of routes) {
    const source = read(path);
    assert.match(source, /import \{ lazy, Suspense \} from "react";/, path);
    assert.match(source, new RegExp(`const ${component} = lazy\\(\\(\\) => import`), path);
    assert.doesNotMatch(source, new RegExp(`import \\{ ${component} \\} from "@/features/admin/components/${component}"`), path);
    assert.match(source, new RegExp(`<Suspense fallback=\\{<LoadingState />\\}>[\\s\\S]*<${component}`), path);
  }
});

test("les gros modules restent absents du shell générique quand ils sont inutilisés", () => {
  const chart = read("src/components/ui/chart.tsx");
  const documents = read("src/features/documents/services/documents.server.ts");
  assert.match(chart, /from "recharts"/);
  assert.match(documents, /await import\("@\/features\/documents\/templates\/receipt-pdf\.server"\)/);
  assert.doesNotMatch(read("src/router.tsx"), /from "recharts"|from "pdf-lib"/);
});


test("les assets critiques du premier écran sont optimisés et le hero est prioritaire", () => {
  const root = read("src/routes/__root.tsx");
  const home = read("src/routes/index.tsx");
  const optimizer = read("scripts/optimize-home-images.mjs");

  assert.match(root, /@fontsource\/sora\/500\.css/);
  assert.match(root, /@fontsource\/manrope\/400\.css/);
  assert.match(root, /@fontsource\/ibm-plex-mono\/400\.css/);
  assert.doesNotMatch(root, /fonts\.googleapis\.com|fonts\.gstatic\.com/);

  assert.match(home, /rel: "preload"/);
  assert.match(home, /as: "image"/);
  assert.match(home, /imageSrcSet: HOME_IMAGE_VARIANTS\.woodbrook\.avif/);
  assert.match(home, /fetchPriority=\{priority \? "high" : "low"\}/);
  assert.match(home, /loading=\{priority \? "eager" : "lazy"\}/);

  assert.match(optimizer, /avif/);
  assert.match(optimizer, /webp/);
  assert.match(optimizer, /withoutEnlargement: true/);
});


test("le budget statique du shell protège LCP/CLS et évite les gros modules au premier chargement", () => {
  const root = read("src/routes/__root.tsx");
  const router = read("src/router.tsx");
  const home = read("src/routes/index.tsx");
  const section = read("src/features/public/components/SectionHeader.tsx");
  const styles = read("src/styles.css");

  assert.doesNotMatch(root, /from ["']recharts["']|from ["']pdf-lib["']|from ["']react-day-picker["']/);
  assert.doesNotMatch(router, /from ["']recharts["']|from ["']pdf-lib["']/);
  assert.match(home, /width=\{1280\}[\\s\\S]*?height=\{960\}/);
  assert.match(home, /priority/);
  assert.match(section, /content-auto/);
  assert.match(styles, /content-visibility:\\s*auto/);
});


test("le chargement sur réseau mobile reste borné et ne refetch pas tout le cache hors écran", () => {
  const policy = read("src/lib/query-policy.ts");
  const banner = read("src/features/customer-shell/components/NetworkStatusBanner.tsx");
  const router = read("src/router.tsx");

  assert.equal((policy.match(/networkMode: "online"/g) ?? []).length, 5);
  assert.match(router, /defaultPreloadStaleTime: 30_000/);
  assert.match(banner, /refetchQueries\(\{ type: "active" \}\)/);
  assert.match(banner, /navigator\.onLine/);
});

test("aucune API de préchargement réseau manuel n'est ajoutée au shell critique", () => {
  const root = read("src/routes/__root.tsx");
  const router = read("src/router.tsx");
  assert.doesNotMatch(root, /navigator\.connection|effectiveType|requestIdleCallback/);
  assert.doesNotMatch(router, /prefetchQuery|prefetchInfiniteQuery/);
});


test("les dépendances frontend lourdes restent isolées des shells critiques", () => {
  const root = read("src/routes/__root.tsx");
  const router = read("src/router.tsx");
  const publicLayout = read("src/components/layout/PublicLayout.tsx");
  const bankingLayout = read("src/components/layout/BankingAppLayout.tsx");
  const adminLayout = read("src/components/layout/AdminLayout.tsx");
  const chart = read("src/components/ui/chart.tsx");
  const calendar = read("src/components/ui/calendar.tsx");
  const carousel = read("src/components/ui/carousel.tsx");
  const resizable = read("src/components/ui/resizable.tsx");
  const documents = read("src/features/documents/services/documents.server.ts");

  for (const source of [root, router, publicLayout, bankingLayout, adminLayout]) {
    assert.doesNotMatch(
      source,
      /(?:from\s+["'](?:recharts|pdf-lib|react-day-picker|embla-carousel-react|react-resizable-panels)["']|import\(\s*["'](?:recharts|pdf-lib|react-day-picker|embla-carousel-react|react-resizable-panels)["'])/,
    );
  }

  assert.match(chart, /from "recharts"/);
  assert.match(calendar, /from "react-day-picker"/);
  assert.match(carousel, /from "embla-carousel-react"/);
  assert.match(resizable, /from "react-resizable-panels"/);
  assert.match(documents, /await import\("@\/features\/documents\/templates\/receipt-pdf\.server"\)/);
});

test("les cinq dépendances lourdes restent documentées comme modules ciblés du bundle", () => {
  const packageJson = read("package.json");
  for (const dependency of [
    "recharts",
    "pdf-lib",
    "react-day-picker",
    "embla-carousel-react",
    "react-resizable-panels",
  ]) {
    assert.match(packageJson, new RegExp('"' + dependency.replace(/[.*+?^$()|[\]\\]/g, "\\$&") + '"\\s*:'));
  }
});


test("le motion design reste court, coherent et compatible reduced motion", () => {
  const button = read("src/components/ui/button.tsx");
  const dialog = read("src/components/ui/dialog.tsx");
  const sheet = read("src/components/ui/sheet.tsx");
  const select = read("src/components/ui/select.tsx");
  const styles = read("src/styles.css");

  assert.match(button, /motion-safe:transition-/);
  assert.match(dialog, /motion-reduce:animate-none/);
  assert.match(sheet, /motion-safe:transition-transform/);
  assert.match(sheet, /motion-reduce:animate-none/);
  assert.match(select, /motion-reduce:animate-none/);
  assert.match(styles, /@utility motion-micro/);
  assert.match(styles, /@utility motion-reveal/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("lexperience mobile native conserve navigation, safe area et feuilles tactiles", () => {
  const nav = read("src/components/navigation/CustomerBottomNav.tsx");
  const layout = read("src/components/layout/BankingAppLayout.tsx");
  const sheet = read("src/components/ui/sheet.tsx");
  const styles = read("src/styles.css");

  assert.match(nav, /safe-pb/);
  assert.match(nav, /backdrop-blur-xl/);
  assert.match(layout, /pb-mobile-nav/);
  assert.match(layout, /overscroll-x-none/);
  assert.match(sheet, /max-h-\[92dvh\]/);
  assert.match(sheet, /overscroll-contain/);
  assert.match(styles, /safe-area-inset-bottom/);
  assert.match(styles, /touch-action: manipulation/);
});

test("le dashboard conserve une hierarchie claire et des actions accessibles", () => {
  const dashboard = read("src/routes/app.dashboard.tsx");
  const actionRequired = read("src/features/transfers/components/ActionRequiredTransfers.tsx");

  assert.match(dashboard, /<section aria-labelledby="activity-heading"/);
  assert.match(dashboard, /focus-visible:ring-2 focus-visible:ring-ring/);
  assert.match(dashboard, /motion-reduce:transition-none/);
  assert.ok(dashboard.indexOf("<ActionRequiredTransfers />") < dashboard.indexOf("<MonthlySummaryCard"), "actions requises avant le resume mensuel");
  assert.match(actionRequired, /focus-visible:ring-2 focus-visible:ring-ring/);
  assert.match(actionRequired, /min-h-11/);
});

test("les interactions modernes respectent feedback, accessibilité et réduction de mouvement", () => {
  const button = read("src/components/ui/button.tsx");
  const dialog = read("src/components/ui/dialog.tsx");
  const sheet = read("src/components/ui/sheet.tsx");
  const select = read("src/components/ui/select.tsx");

  assert.match(button, /role="status" aria-live="polite"/);
  assert.match(button, /aria-busy=\{loading \|\| undefined\}/);
  assert.match(dialog, /motion-reduce:animate-none/);
  assert.match(sheet, /motion-reduce:animate-none/);
  assert.match(select, /motion-reduce:animate-none/);
});

test("la plateforme supporte un thème adaptatif 2026 sans décalage entre préférence système et interface", () => {
  const theme = read("src/components/providers/ThemeProvider.tsx");
  const preferences = read("src/features/profile/components/PreferencesPage.tsx");

  assert.match(theme, /ThemeMode = "light" \| "dark" \| "system"/);
  assert.match(theme, /prefers-color-scheme: dark/);
  assert.match(theme, /addEventListener\?\.\("change"/);
  assert.match(theme, /theme === "light" \? "dark" : theme === "dark" \? "system" : "light"/);
  assert.match(preferences, /setTheme\(result\.theme\)/);
  assert.match(preferences, /value={form\.theme}/);
  assert.match(preferences, /value="system"/);
});

test("5.8.8.1 standardise les primitives de contrôle sur une même grammaire visuelle", () => {
  const button = read("src/components/ui/button.tsx");
  const input = read("src/components/ui/input.tsx");
  const textarea = read("src/components/ui/textarea.tsx");
  const select = read("src/components/ui/select.tsx");
  const tabs = read("src/components/ui/tabs.tsx");

  for (const source of [button, input, textarea, select, tabs]) {
    assert.match(source, /focus-visible:ring-2 focus-visible:ring-ring/);
    assert.match(source, /focus-visible:ring-offset-2/);
    assert.match(source, /motion-safe:transition-/);
    assert.match(source, /duration-150/);
  }

  assert.match(button, /min-h-11/);
  assert.match(input, /min-h-11/);
  assert.match(textarea, /min-h-\[60px\]/);
  assert.match(select, /min-h-11 w-full/);
  assert.match(select, /focus-visible:outline-none/);
  assert.match(tabs, /TabsTrigger[\\s\\S]*min-h-11/);
});

test("5.8.8.1 conserve le reduced-motion sur les primitives animées", () => {
  const select = read("src/components/ui/select.tsx");
  const dialog = read("src/components/ui/dialog.tsx");
  const sheet = read("src/components/ui/sheet.tsx");
  const styles = read("src/styles.css");

  assert.match(select, /motion-reduce:animate-none/);
  assert.match(dialog, /motion-reduce:animate-none/);
  assert.match(sheet, /motion-reduce:animate-none/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});


test("5.8.8.3 aligne les écrans client sur les primitives de page et de surface partagées", () => {
  const header = read("src/components/layout/PageHeader.tsx");
  const account = read("src/features/accounts/components/AccountListItem.tsx");
  const more = read("src/routes/app.more.tsx");
  const featureShell = read("src/features/customer-shell/components/FeatureShellPage.tsx");

  assert.match(header, /text-heading-xl text-balance text-foreground/);
  assert.doesNotMatch(header, /sm:text-3xl/);
  assert.match(account, /native-surface press-feedback/);
  assert.match(account, /motion-safe:transition-\[border-color,box-shadow,transform\]/);
  assert.match(account, /motion-reduce:transition-none/);
  assert.match(more, /text-overline text-muted-foreground/);
  assert.match(featureShell, /BankingContentContainer width=\{width\}/);
  assert.match(featureShell, /<PageSection>/);
});


test("5.8.8.4 aligne les surfaces et la motion de la console administrative", () => {
  const table = read("src/components/ui/table.tsx");
  const sidebar = read("src/components/navigation/AdminSidebar.tsx");
  const layout = read("src/components/layout/AdminLayout.tsx");
  const dashboard = read("src/routes/admin.dashboard.tsx");
  const funding = read("src/routes/admin.funding.tsx");
  const onboarding = read("src/routes/admin.onboarding-cases.tsx");

  assert.match(table, /motion-safe:transition-\\[background-color,border-color\\]/);
  assert.match(table, /motion-reduce:transition-none/);
  assert.match(sidebar, /text-overline text-muted-foreground/);
  assert.match(layout, /text-caption font-medium/);
  assert.match(dashboard, /native-surface p-4 sm:p-5/);
  assert.match(funding, /<PageSection>[\\s\\S]*<PageHeader/);
  assert.match(onboarding, /native-surface mb-5/);
});


test("5.8.8.5 standardise les états globaux de feedback", () => {
  const feedback = read("src/components/feedback/index.tsx");
  const state = read("src/components/feedback/StateBlock.tsx");
  const skeleton = read("src/components/ui/skeleton.tsx");
  assert.match(feedback, /min-h-24 items-center justify-center gap-2 rounded-xl border border-border bg-surface/);
  assert.match(feedback, /motion-reduce:transition-none/);
  assert.match(state, /min-h-44 flex flex-col items-center justify-center/);
  assert.match(state, /motion-reduce:transition-none/);
  assert.match(skeleton, /animate-pulse/);
});


test("5.8.8.6 renforce la responsivité des overlays sur petits écrans", () => {
  const dialog = read("src/components/ui/dialog.tsx");
  const sheet = read("src/components/ui/sheet.tsx");
  const banking = read("src/components/layout/BankingAppLayout.tsx");
  const admin = read("src/components/layout/AdminLayout.tsx");
  assert.match(dialog, /w-\\[calc\\(100vw-2rem\\)\\]/);
  assert.match(dialog, /max-h-\\[calc\\(100dvh-2rem\\)\\]/);
  assert.match(dialog, /overflow-y-auto/);
  assert.match(sheet, /max-w-full overflow-y-auto overscroll-contain/);
  assert.match(sheet, /bottom:.*max-h-\\\[92dvh\\\]/s);
  assert.match(banking, /min-w-0 flex-1 overscroll-x-none/);
  assert.match(admin, /min-w-0 flex-1 overscroll-x-none/);
});
