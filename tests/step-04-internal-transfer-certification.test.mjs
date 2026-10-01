import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const functions = read("src/features/transfers/services/transfers.functions.ts");
const server = read("src/features/transfers/services/transfers.server.ts");
const types = read("src/features/transfers/types/transfer.ts");
const hooks = read("src/features/transfers/hooks/useTransfers.ts");
const beneficiaryFunctions = read("src/features/beneficiaries/services/beneficiaries.functions.ts");
const beneficiaryServer = read("src/features/beneficiaries/services/beneficiaries.server.ts");
const newRoute = read("src/routes/app.transfers.new.tsx");
const listRoute = read("src/routes/app.transfers.index.tsx");
const wizard = read("src/features/transfers/components/TransferWizard.tsx");

test("Step 04 — transfer commands require an authenticated session", () => {
  assert.match(functions, /initiateTransfer = createServerFn/);
  assert.match(functions, /confirmTransferExecution = createServerFn/);
  assert.match(functions, /middleware\(\[requireSupabaseAuth\]\)/);
});

test("Step 04 — source account and amount are validated server-side", () => {
  assert.match(functions, /ACCOUNT_PATTERN/);
  assert.match(functions, /INVALID_ACCOUNT_REFERENCE/);
  assert.match(functions, /Number\.isInteger\(amountMinor\)/);
  assert.match(functions, /amountMinor <= 0/);
});

test("Step 04 — beneficiary ownership and destination classification stay server-side", () => {
  assert.match(functions, /BENEFICIARY_REFERENCE_PATTERN/);
  assert.match(server, /create_customer_transfer/);
  assert.match(server, /_beneficiary_reference/);
  assert.match(types, /TransferKind = "INTERNAL_TRANSFER" \| "EXTERNAL_TRANSFER"/);
  assert.match(server, /client never chooses a transfer kind/);
});

test("Step 04 — internal execution uses the trusted financial command", () => {
  assert.match(server, /confirm_customer_transfer/);
  assert.match(server, /INTERNAL_TRANSFER/);
  assert.match(server, /two-sided journal/);
  assert.match(server, /idempotent|Retrying with the same reference is safe/);
});

test("Step 04 — confirmation requires recent authentication", () => {
  assert.match(functions, /consume_security_step_up/);
  assert.match(functions, /RECENT_AUTHENTICATION_REQUIRED/);
  assert.match(hooks, /signInWithPassword/);
  assert.match(hooks, /authorizeTransferConfirmation/);
});

test("Step 04 — financial UI never adjusts balances locally", () => {
  assert.match(hooks, /invalidateQueries\(\{ queryKey: ACCOUNTS_KEY \}\)/);
  assert.match(hooks, /invalidateQueries\(\{ queryKey: TRANSACTIONS_KEY \}\)/);
  assert.match(hooks, /invalidateQueries\(\{ queryKey: TRANSFERS_KEY \}\)/);
  assert.doesNotMatch(hooks, /setQueryData\(.*ACCOUNTS_KEY/);
});

test("Step 04 — beneficiary references are customer-scoped server operations", () => {
  assert.match(beneficiaryFunctions, /listCustomerBeneficiaries/);
  assert.match(beneficiaryFunctions, /createBeneficiary/);
  assert.match(beneficiaryFunctions, /requireSupabaseAuth/);
  assert.match(beneficiaryServer, /userId/);
});

test("Step 04 — transactional routes are lifecycle-gated", () => {
  assert.match(newRoute, /isAllowed\(summary\.lifecycleState, "transactional"\)/);
  assert.match(listRoute, /isAllowed\(summary\.lifecycleState, "transactional"\)/);
});

test("Step 04 — customer confirmation UI reflects server-authoritative outcome", () => {
  assert.match(wizard, /confirm\.mutate/);
  assert.match(wizard, /outcome\.status/);
  assert.match(wizard, /outcome\.progressPercent/);
  assert.match(wizard, /outcome\.transactionReference/);
});
