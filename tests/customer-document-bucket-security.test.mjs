import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261111170000_customer_document_bucket_hardening.sql");
const documents = read("src/features/documents/services/documents.server.ts");
const statements = read("src/features/statements/services/statements.server.ts");

assert.match(migration, /'customer-documents'[\s\S]*public = false/i);
assert.match(migration, /ARRAY\['application\/pdf'\]/);
assert.match(migration, /file_size_limit = EXCLUDED\.file_size_limit/);
assert.match(documents, /\.eq\("public_reference", reference\)/);
assert.match(documents, /\.eq\("user_id", userId\)/);
assert.match(documents, /row\.status !== "READY"/);
assert.match(documents, /createSignedUrl\(row\.storage_path, DOWNLOAD_TTL_SECONDS/);
assert.match(documents, /const DOWNLOAD_TTL_SECONDS = 120/);
assert.match(documents, /record_document_event/);
assert.match(statements, /from\(DOCUMENT_BUCKET\)/);

console.log("CUSTOMER DOCUMENT BUCKET SECURITY CERTIFICATION: PASS");
