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
