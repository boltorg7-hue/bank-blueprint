import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const migrationDir = "supabase/migrations";
const migrationFiles = readdirSync(migrationDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const migration = migrationFiles
  .map((name) => ({
    name,
    content: readFileSync(`${migrationDir}/${name}`, "utf8"),
  }))
  .find(({ name }) =>
    name === "20261004130000_admin_customer_page_document_history_attention.sql",
  );

test("admin customer page uses document status history for exact ACTION_REQUIRED and REJECTED timing", () => {
  assert.ok(migration, "9.6 read-model migration is missing");

  const file = migration.content;

  assert.match(file, /verification_document_status_history/i);
  assert.match(file, /h\.document_id\s*=\s*vd\.id/i);
  assert.match(file, /h\.new_status\s*=\s*vd\.status/i);
  assert.match(file, /order by h\.created_at desc/i);
  assert.match(file, /when vd\.status\s*=\s*'EXPIRED'\s+then vd\.expires_at/i);
  assert.match(
    file,
    /coalesce\([\s\S]*h\.created_at[\s\S]*vd\.updated_at[\s\S]*vd\.created_at/i,
  );
  assert.match(file, /as document_attention_at/i);
});

test("9.6 preserves the existing six attention categories and oldest-attention aggregation", () => {
  assert.ok(migration, "9.6 read-model migration is missing");

  const file = migration.content;

  for (const reason of [
    "LIFECYCLE",
    "KYC",
    "DOCUMENTS",
    "NOTIFICATIONS",
    "TRANSFERS",
    "FUNDING",
  ]) {
    assert.match(file, new RegExp("\\'" + reason + "\\'"), `attention category changed: ${reason}`);
  }

  assert.match(file, /as oldest_attention_at/i);
  assert.match(file, /f\.document_attention_at/i);
});
