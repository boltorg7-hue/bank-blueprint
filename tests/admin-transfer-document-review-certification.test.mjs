import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const service = fs.readFileSync(
  "src/features/admin/services/transfer-document-review.server.ts",
  "utf8",
);
const functions = fs.readFileSync(
  "src/features/admin/services/transfer-document-review.functions.ts",
  "utf8",
);
const component = fs.readFileSync(
  "src/features/admin/components/TransferDocumentsReview.tsx",
  "utf8",
);
const migration = fs.readFileSync(
  "supabase/migrations/20261112130000_transfer_document_review_audit.sql",
  "utf8",
);

test("Lot 1 — document review is server-authorized and limited to external transfers", () => {
  assert.match(service, /requireAdminPermission\(client, "compliance\.review"\)/);
  assert.match(service, /transfer_kind !== "EXTERNAL_TRANSFER"/);
  assert.match(functions, /\.middleware\(\[requireSupabaseAuth\]\)/);
  assert.match(functions, /context\.userId/);
  assert.match(functions, /review_transfer_document/);
});

test("Lot 1 — private files are exposed only through short-lived signed URLs", () => {
  assert.match(service, /\.from\("transfer-documents"\)/);
  assert.match(service, /createSignedUrl\(document\.storage_path, 60\)/);
  assert.match(service, /expiresInSeconds: 60/);
  assert.doesNotMatch(service, /storagePath:/);
});

test("Lot 1 — admin UI supports accept, replacement requests and history", () => {
  assert.match(component, /"Accept"/);
  assert.match(component, /"Request replacement"/);
  assert.match(component, /Review history/);
  assert.match(migration, /transfer_document_review_history/);
  assert.match(migration, /BEFORE UPDATE OR DELETE/);
  assert.match(migration, /BEFORE TRUNCATE/);
  assert.match(migration, /_t\.transfer_kind <> 'EXTERNAL_TRANSFER'/);
  assert.match(migration, /_t\.sender_user_id <> _doc\.user_id/);
  assert.match(migration, /INSERT INTO public\.admin_audit_events/);
  assert.match(migration, /DOCUMENTS_ACCEPTED/);
});
