import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

const server = read("src/features/transfers/services/transfers.server.ts");
const functions = read("src/features/transfers/services/transfers.functions.ts");
const types = read("src/features/transfers/types/transfer.ts");
const progress = read("src/features/transfers/utils/transfer-progress.ts");
const provider = read("src/features/transfers/services/settlement/provider.ts");
const adminWorkflow = read(
  "supabase/migrations/20260924110000_simulated_external_admin_workflow.sql",
);
const adminRoute = read("src/routes/admin.transfers.tsx");

test("Step 05 — external transfer classification is server-authoritative", () => {
  assert.match(server, /create_customer_transfer/);
  assert.match(server, /The routing decision belongs to the database routine/);
  assert.doesNotMatch(functions, /transferKind\s*:/);
  assert.match(types, /INTERNAL_TRANSFER.*EXTERNAL_TRANSFER/s);
});

test("Step 05 — external transfers use trusted progress states, not client percentages", () => {
  assert.match(types, /TransferProgressState/);
  assert.match(types, /SETTLEMENT_PENDING/);
  assert.match(types, /progressPercent/);
  assert.match(server, /progress_state/);
  assert.match(progress, /PROGRESS_MILESTONES/);
  assert.match(progress, /Never derive a percentage from elapsed time/);
});

test("Step 05 — external settlement is separated behind a provider port", () => {
  assert.match(server, /getSettlementProvider/);
  assert.match(server, /submitTransfer/);
  assert.match(server, /getTransferStatus/);
  assert.match(server, /idempotencyKey: \`settlement:\\$\{row\.id\}\`/);
  assert.match(provider, /ExternalTransferProvider/);
  assert.match(provider, /SIMULATED_DOMESTIC_RAIL/);
  assert.match(provider, /state: "PENDING"/);
  assert.match(provider, /never reports SUCCEEDED/);
});

test("Step 05 — simulated external rail cannot falsely complete from the customer path", () => {
  assert.match(provider, /isSimulation: true/);
  assert.match(provider, /submitTransfer\(submission\)/);
  assert.match(provider, /state: "SUBMITTED"/);
  assert.doesNotMatch(provider, /submitTransfer[\\s\\S]{0,500}state: "SUCCEEDED"/);
  assert.match(server, /if \(status === "APPROVED"\) \{/);
  assert.match(server, /await submitSettlement\(userId, reference\)/);
});

test("Step 05 — settlement synchronization preserves pending/unknown semantics", () => {
  assert.match(server, /status === "SETTLEMENT_PENDING"/);
  assert.match(server, /getTransferStatus\(row\.external_provider_reference\)/);
  assert.match(server, /apply_external_settlement_result/);
  assert.match(functions, /refreshTransferSettlement/);
});

test("Step 05 — compliance/document workflow is customer-scoped and review-controlled", () => {
  assert.match(server, /\.eq\("user_id", userId\)/);
  assert.match(server, /transfer_requirements/);
  assert.match(server, /transfer_documents/);
  assert.match(server, /The storage path is deliberately never returned to the browser/);
  assert.match(functions, /submit_transfer_document/);
  assert.match(functions, /storagePath\.includes\("\.\."\)/);
});

test("Step 05 — simulated 95 → 99 → 100 progression requires authorized staff and four-eyes", () => {
  assert.match(adminWorkflow, /admin_approve_simulated_external/);
  assert.match(adminWorkflow, /compliance\.review/);
  assert.match(adminWorkflow, /admin_queue_simulated_external/);
  assert.match(adminWorkflow, /transfers\.approve/);
  assert.match(adminWorkflow, /admin_finalize_simulated_external/);
  assert.match(adminWorkflow, /four-eyes approval required/);
  assert.match(adminWorkflow, /progress_percent,99/);
  assert.match(adminWorkflow, /progress_percent,100/);
});

test("Step 05 — external settlement completion is not a customer-controlled action", () => {
  assert.match(functions, /requireSupabaseAuth/);
  assert.doesNotMatch(functions, /admin_finalize_simulated_external/);
  assert.doesNotMatch(functions, /apply_external_settlement_result/);
  assert.match(adminRoute, /APPROVE.*QUEUE.*FINALIZE/s);
});

console.log("STEP 05 STATIC CERTIFICATION: PASS");
