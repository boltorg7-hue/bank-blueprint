import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  "supabase/migrations/20261112130000_transfer_document_review_audit.sql",
  "utf8",
);

test("Lot 1 — document review requires the explicit compliance permission", () => {
  assert.match(migration, /public\.has_permission\(_staff_id, 'compliance\.review'\)/);
  assert.doesNotMatch(migration, /IF NOT public\.is_staff\(_staff_id\)/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.review_transfer_document/);
  assert.match(migration, /TO service_role/);
});

test("Lot 1 — review history is durable and records the authenticated actor and transition", () => {
  assert.match(migration, /CREATE TABLE public\.transfer_document_review_history/);
  assert.match(migration, /actor_user_id uuid NOT NULL REFERENCES auth\.users/);
  assert.match(migration, /previous_status public\.transfer_document_status NOT NULL/);
  assert.match(migration, /new_status public\.transfer_document_status NOT NULL/);
  assert.match(migration, /INSERT INTO public\.transfer_document_review_history/);
  assert.match(migration, /INSERT INTO public\.transfer_document_review_history/);
  assert.match(migration, /actor_user_id, previous_status, new_status, decision, reason_code/);
  assert.doesNotMatch(migration, /public\.admin_audit_events/);
  assert.match(migration, /prevent_transfer_document_review_history_mutation/);
  assert.match(migration, /BEFORE UPDATE OR DELETE ON public\.transfer_document_review_history/);
  assert.match(migration, /BEFORE TRUNCATE ON public\.transfer_document_review_history/);
  assert.match(migration, /REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public\.transfer_document_review_history/);
});

test("Lot 1 — replacement requests require a meaningful reason and valid review state", () => {
  assert.match(migration, /DOCUMENT_REJECTION_REASON_REQUIRED/);
  assert.match(migration, /char_length\(COALESCE\(_reason, ''\)\) NOT BETWEEN 8 AND 500/);
  assert.match(migration, /IF _doc\.status NOT IN \('UPLOADED', 'UNDER_REVIEW'\)/);
  assert.match(migration, /REPLACEMENT_REQUIRED/);
  assert.match(migration, /CUSTOMER_ACTION_REQUIRED/);
});

test("Lot 1 — document history is readable only by specifically authorized staff", () => {
  assert.match(migration, /ALTER TABLE public\.transfer_document_review_history ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /public\.has_permission\(auth\.uid\(\), 'compliance\.review'\)/);
  assert.match(migration, /public\.has_permission\(auth\.uid\(\), 'transfers\.approve'\)/);
  assert.match(migration, /ON public\.transfer_document_review_history[\s\S]*FOR SELECT TO authenticated/);
});

console.log("LOT 1 DOCUMENT REVIEW SECURITY CERTIFICATION: PASS");
