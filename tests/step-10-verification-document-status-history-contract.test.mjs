import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const migrationDir = "supabase/migrations";
const migrationFiles = readdirSync(migrationDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const allMigrations = migrationFiles
  .map((name) => ({
    name,
    content: readFileSync(`${migrationDir}/${name}`, "utf8"),
  }))
  .filter(({ content }) =>
    /verification_document_status_history|verification_documents_status_history/i.test(content),
  );

const historyMigrations = allMigrations.map(({ name, content }) => ({
  name,
  content,
}));

test("verification document status history has an explicit dedicated table contract", () => {
  assert.ok(
    historyMigrations.length > 0,
    "dedicated verification_document_status_history migration is missing",
  );

  const file = historyMigrations.at(-1)?.content ?? "";

  assert.match(
    file,
    /create table public\.verification_document_status_history\s*\(/i,
    "history table must be explicitly created",
  );

  for (const column of [
    "id UUID",
    "document_id UUID",
    "user_id UUID",
    "previous_status public.verification_document_status",
    "new_status public.verification_document_status",
    "changed_by UUID",
    "change_source",
    "note TEXT",
    "created_at TIMESTAMPTZ",
  ]) {
    assert.match(file, new RegExp(column.replace(/[.*+?^{}()|[\\]\\\\]/g, "\\$&"), "i"), `history column missing: ${column}`);
  }

  assert.match(
    file,
    /document_id UUID NOT NULL REFERENCES public\.verification_documents\(id\) ON DELETE CASCADE/i,
    "history must remain attached to its document",
  );
  assert.match(
    file,
    /user_id UUID NOT NULL REFERENCES auth\.users\(id\) ON DELETE CASCADE/i,
    "history must remain attached to the customer",
  );
  assert.match(
    file,
    /previous_status public\.verification_document_status(?: NULL)?/i,
    "previous_status must allow NULL for initial creation",
  );
  assert.match(
    file,
    /new_status public\.verification_document_status NOT NULL/i,
    "new_status must always be known",
  );
  assert.match(
    file,
    /created_at TIMESTAMPTZ NOT NULL DEFAULT now\(\)/i,
    "history event timestamp must be database-generated",
  );
});

test("status history is captured by a database trigger, not duplicated in application code", () => {
  const file = historyMigrations.at(-1)?.content ?? "";

  assert.match(
    file,
    /create or replace function public\.[a-z0-9_]*verification_document[a-z0-9_]*status[a-z0-9_]*history[a-z0-9_]*\(\)/i,
    "a dedicated PostgreSQL capture function is required",
  );
  assert.match(
    file,
    /create trigger [a-z0-9_]*verification_document[a-z0-9_]*status[a-z0-9_]*history[a-z0-9_]*\s+after insert or update(?:\s+of\s+status)?\s+on public\.verification_documents/i,
    "capture must be attached directly to verification_documents and may restrict UPDATE events to status",
  );
  assert.match(
    file,
    /old\.status\s+is distinct from\s+new\.status/i,
    "UPDATE events must be recorded only when the status actually changes",
  );
});

test("document creation records the initial NULL to inserted status state", () => {
  const file = historyMigrations.at(-1)?.content ?? "";

  assert.match(
    file,
    /tg_op\s*=\s*'INSERT'/i,
    "trigger must distinguish document creation from updates",
  );
  assert.match(
    file,
    /previous_status[^\n]*NULL/i,
    "initial history event must use NULL as previous_status",
  );
  assert.match(
    file,
    /new_status[^\n]*NEW\.status/i,
    "initial history event must capture the inserted status",
  );
});

test("non-status updates do not create document status history events", () => {
  const file = historyMigrations.at(-1)?.content ?? "";

  assert.match(
    file,
    /old\.status\s+is distinct from\s+new\.status/i,
    "history capture must be status-change based",
  );
  assert.doesNotMatch(
    file,
    /verification_documents.*updated_at.*verification_document_status_history/is,
    "updated_at changes must not themselves become status history events",
  );
});

test("history records actor and source without requiring auth.uid()", () => {
  const file = historyMigrations.at(-1)?.content ?? "";

  assert.match(
    file,
    /changed_by\s+UUID\s*(?:NULL)?/i,
    "changed_by must be nullable",
  );
  assert.match(
    file,
    /auth\.uid\(\)/i,
    "capture should attempt to associate the authenticated actor",
  );
  assert.match(
    file,
    /change_source/i,
    "change_source is required to distinguish customer/admin/system mutations",
  );
  assert.match(
    file,
    /CUSTOMER|ADMIN|SYSTEM/i,
    "change_source must have a controlled business vocabulary",
  );
});

test("history capture is observational and does not enforce document workflow transitions", () => {
  const file = historyMigrations.at(-1)?.content ?? "";

  assert.doesNotMatch(
    file,
    /raise exception|raise notice.*invalid.*status|raise exception.*status/i,
    "history trigger must not become the business transition validator",
  );
  assert.match(
    file,
    /insert into public\.verification_document_status_history/i,
    "trigger must only persist the observed transition",
  );
});

test("history table is protected by RLS and does not expose unrestricted writes to customers", () => {
  const file = historyMigrations.at(-1)?.content ?? "";

  assert.match(
    file,
    /alter table public\.verification_document_status_history enable row level security/i,
    "history table must have RLS enabled",
  );
  assert.match(
    file,
    /grant select on public\.verification_document_status_history to authenticated/i,
    "authenticated users need explicit read access",
  );
  assert.doesNotMatch(
    file,
    /grant (?:insert|update|delete|all) on public\.verification_document_status_history to authenticated/i,
    "customers must not be granted direct history writes",
  );
});

test("history is not backfilled with fabricated historical transitions", () => {
  const file = historyMigrations.at(-1)?.content ?? "";

  assert.doesNotMatch(
    file,
    /insert into public\.verification_document_status_history[\s\S]*from public\.verification_documents/i,
    "the migration must not fabricate historical events from current document rows",
  );
});

test("history events expose database timestamps for future exact attention calculation", () => {
  const file = historyMigrations.at(-1)?.content ?? "";

  assert.match(
    file,
    /created_at TIMESTAMPTZ NOT NULL DEFAULT now\(\)/i,
    "transition timestamp must be available to a later read-model integration",
  );
  assert.doesNotMatch(
    file,
    /admin_customer_page|20261004100000_admin_customer_page_contract/i,
    "9.4 must not couple history creation to the existing admin_customer_page read model",
  );
});
