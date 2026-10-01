import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const accountsServer = read("src/features/accounts/services/accounts.server.ts");
const accountsFunctions = read("src/features/accounts/services/accounts.functions.ts");
const accountTypes = read("src/features/accounts/types/account.ts");
const transactionsServer = read("src/features/transactions/services/transactions.server.ts");
const transactionsFunctions = read("src/features/transactions/services/transactions.functions.ts");
const transactionsHook = read("src/features/transactions/hooks/useTransactions.ts");
const accountDetailsRoute = read("src/routes/app.accounts.$accountRef.tsx");
const balanceCard = read("src/features/accounts/components/AccountBalanceCard.tsx");
const coordinates = read("src/features/accounts/components/AccountCoordinatesPanel.tsx");
const ledger = read("supabase/migrations/20260827145505_651ee426-eb81-4e27-a193-285cd3a4169e.sql");

test("Step 02 — account read model is customer-scoped", () => {
  assert.match(accountsServer, /from\("bank_accounts"\)[\s\S]*?eq\("user_id", userId\)/);
  assert.match(accountsServer, /eq\("user_id", userId\)[\s\S]*?eq\("public_reference", reference\)/);
  assert.match(accountsFunctions, /middleware\(\[requireSupabaseAuth\]\)/);
});

test("Step 02 — account references are validated before lookup", () => {
  assert.match(accountsFunctions, /\^ACC-\\d\{4\}-\\d\{6\}\$/);
});

test("Step 02 — balance is read-only and uses integer minor units", () => {
  assert.match(accountTypes, /ledgerBalanceMinor: number/);
  assert.match(accountTypes, /availableBalanceMinor: number/);
  assert.match(accountTypes, /heldBalanceMinor: number/);
  assert.match(accountsServer, /BALANCE_COLUMNS/);
  assert.doesNotMatch(accountsServer, /\.update\([\s\S]*account_balances/);
  assert.doesNotMatch(accountsServer, /\.insert\([\s\S]*account_balances/);
});

test("Step 02 — missing balance is explicit, never fabricated as zero", () => {
  assert.match(accountTypes, /Null means "balance unavailable"/);
  assert.match(balanceCard, /Balance unavailable/);
  assert.match(balanceCard, /No approximate amount is shown/);
});

test("Step 02 — recent activity uses the authenticated transaction path", () => {
  assert.match(transactionsFunctions, /middleware\(\[requireSupabaseAuth\]\)/);
  assert.match(transactionsFunctions, /getAccountActivity/);
  assert.match(transactionsServer, /customer_account_activity/);
  assert.match(transactionsServer, /account_reference/);
  assert.match(transactionsHook, /enabled:\s*Boolean\(accountReference\)/);
  assert.match(accountDetailsRoute, /useAccountActivity\(account\?\.reference \?\? null, 5\)/);
});

test("Step 02 — neutral ledger movements do not become customer credit/debit activity", () => {
  assert.match(accountsServer, /\.filter\(\(item\) => item\.direction !== "NEUTRAL"\)/);
  assert.match(accountDetailsRoute, /\.filter\(\(item\) => item\.direction !== "NEUTRAL"\)/);
});

test("Step 02 — posted ledger transactions are immutable", () => {
  assert.match(ledger, /posted ledger transactions are immutable/);
  assert.match(ledger, /ledger entries are immutable/);
  assert.match(ledger, /REVOKE ALL ON FUNCTION public\.post_ledger_transaction/);
});

test("Step 02 — customer activity is explicitly restricted to auth.uid()", () => {
  assert.match(ledger, /CREATE VIEW public\.customer_account_activity/);
  assert.match(ledger, /WHERE t\.status = 'POSTED'\s+AND ba\.user_id = auth\.uid\(\)/);
  assert.match(ledger, /GRANT SELECT ON public\.customer_account_activity TO authenticated/);
});

test("Step 02 — balance projection is derived from posted ledger entries and active holds", () => {
  assert.match(ledger, /t\.status = 'POSTED'/);
  assert.match(ledger, /CASE WHEN e\.entry_side = 'CREDIT' THEN e\.amount_minor ELSE -e\.amount_minor END/);
  assert.match(ledger, /available_balance_minor, held_balance_minor/);
  assert.match(ledger, /_ledger - _held/);
});

test("Step 02 — dashboard monthly summary is explicitly marked unavailable on degraded ledger access", () => {
  assert.match(accountsServer, /ledgerAvailable: false/);
  assert.match(accountsServer, /catch \{/);
  assert.match(accountsServer, /ledgerAvailable: true/);
});

test("Step 02 — full account number is masked until explicit reveal", () => {
  assert.match(coordinates, /revealed \? coordinates\.accountNumber : maskFull\(coordinates\.accountNumber\)/);
  assert.match(coordinates, /onClick=\{\(\) => setRevealed/);
});

test("Step 02 — customer DTOs do not expose internal ledger identifiers", () => {
  assert.doesNotMatch(accountTypes, /ledgerAccountId/);
  assert.doesNotMatch(accountTypes, /ledgerEntryId/);
});
