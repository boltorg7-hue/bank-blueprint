import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  "supabase/migrations/20261112140000_simulated_external_three_person_provider_flow.sql",
  "utf8",
);
const service = fs.readFileSync(
  "src/features/admin/services/simulated-external-transfer.server.ts",
  "utf8",
);
const functions = fs.readFileSync("src/features/admin/services/admin.functions.ts", "utf8");

test("Simulated external queue submits through the simulation provider", () => {
  assert.match(service, /getSettlementProvider/);
  assert.match(service, /provider\.isSimulation/);
  assert.match(service, /outcome\.isSimulation/);
  assert.match(service, /idempotencyKey: "settlement:" \+ row\.id/);
  assert.match(service, /"SUBMITTED", "PENDING"/);
  assert.match(functions, /submitAdminExternalSettlement/);
  assert.match(service, /_provider_status: outcome\.state/);
  assert.match(migration, /TO service_role/);
  assert.match(migration, /FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /DROP FUNCTION IF EXISTS public\.admin_queue_simulated_external\(text\)/);
  assert.match(migration, /_provider_status public\.external_settlement_status/);
  assert.match(migration, /public\.apply_external_settlement_result\(/);
});

test("95%, 99% and 100% require three distinct staff members", () => {
  assert.match(migration, /simulation_approved_by IS NULL/);
  assert.match(migration, /simulation_approved_by = auth\.uid\(\)/);
  assert.match(migration, /simulation_submitted_by IS NULL/);
  assert.match(migration, /THREE_PERSON_APPROVAL_REQUIRED/);
  assert.match(migration, /auth\.uid\(\) = _t\.simulation_approved_by/);
  assert.match(migration, /auth\.uid\(\) = _t\.simulation_submitted_by/);
  assert.match(migration, /simulation_finalized_by = auth\.uid\(\)/);
});
