import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("le shell admin utilise des groupes de navigation explicites", () => {
  const navigation = read("src/config/navigation.ts");
  const sidebar = read("src/components/navigation/AdminSidebar.tsx");

  assert.match(navigation, /group:\s*"overview"/);
  assert.match(navigation, /group:\s*"operations"/);
  assert.match(navigation, /group:\s*"management"/);
  assert.match(sidebar, /GROUP_LABELS/);
  assert.match(sidebar, /item\.group !== previous/);
});

test("la navigation admin reste tactile, accessible et mobile-first", () => {
  const sidebar = read("src/components/navigation/AdminSidebar.tsx");
  const layout = read("src/components/layout/AdminLayout.tsx");

  assert.match(sidebar, /min-h-11/);
  assert.match(sidebar, /focus-visible:ring-2/);
  assert.match(sidebar, /aria-current/);
  assert.match(sidebar, /motion-reduce:transition-none/);
  assert.match(layout, /aria-expanded=\{mobileOpen\}/);
  assert.match(layout, /aria-controls="admin-navigation"/);
  assert.match(layout, /overscroll-x-none/);
  assert.match(layout, /lg:px-8/);
});

test("les écrans admin lourds conservent le chargement différé", () => {
  for (const [path, component] of [
    ["src/routes/admin.accounts.tsx", "AdminAccountsTable"],
    ["src/routes/admin.customers.tsx", "AdminCustomersTable"],
    ["src/routes/admin.funding.tsx", "FundingConsole"],
    ["src/routes/admin.onboarding-cases.tsx", "AdminOnboardingCases"],
  ]) {
    const source = read(path);
    assert.match(source, /lazy/);
    assert.match(source, new RegExp(`const ${component} = lazy\\(\\(\\) => import`), path);
    assert.match(source, new RegExp(`<Suspense fallback=\\{<LoadingState />\\}>[\\s\\S]*<${component}`), path);
  }
});

test("les actions opérationnelles admin ont un feedback tactile et de chargement", () => {
  const accounts = read("src/features/admin/components/AdminAccountsTable.tsx");
  const customers = read("src/features/admin/components/AdminCustomersTable.tsx");
  const funding = read("src/features/admin/components/FundingConsole.tsx");

  assert.match(accounts, /min-h-10/);
  assert.match(customers, /border-t border-border pt-3/);
  assert.match(funding, /min-h-11/);
  assert.match(funding, /loading=\{decide\.isPending\}/);
  assert.match(funding, /focus-visible:ring-2/);
});

test("les données admin restent lisibles et denses sans perdre les identifiants ni les montants", () => {
  const accounts = read("src/features/admin/components/AdminAccountsTable.tsx");
  const customers = read("src/features/admin/components/AdminCustomersTable.tsx");
  const funding = read("src/features/admin/components/FundingConsole.tsx");

  assert.match(accounts, /text-right text-numeric/);
  assert.match(accounts, /whitespace-nowrap text-right text-numeric/);
  assert.match(accounts, /truncate font-medium/);
  assert.match(customers, /text-right text-numeric/);
  assert.match(customers, /truncate font-medium/);
  assert.match(funding, /min-h-11 w-full/);
  assert.match(funding, /line-clamp-2/);
  assert.match(funding, /whitespace-nowrap text-right text-numeric/);
});
