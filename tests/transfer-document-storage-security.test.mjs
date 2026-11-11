import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261111160000_transfer_document_storage_hardening.sql");
const server = read("src/features/transfers/services/transfers.server.ts");
const hook = read("src/features/transfers/hooks/useTransfers.ts");

assert.match(migration, /INSERT INTO storage\.buckets[\s\S]*'transfer-documents'[\s\S]*public = false/i);
assert.match(migration, /file_size_limit = EXCLUDED\.file_size_limit/);
assert.match(migration, /allowed_mime_types = EXCLUDED\.allowed_mime_types/);
assert.match(migration, /DROP POLICY IF EXISTS "Customers replace their own transfer documents"/);
assert.match(migration, /public\.has_permission\(auth\.uid\(\), 'compliance\.review'\)/);
assert.match(migration, /public\.has_permission\(auth\.uid\(\), 'transfers\.approve'\)/);
assert.doesNotMatch(migration, /public\.is_staff\(auth\.uid\(\)\)/);
assert.match(migration, /CREATE POLICY "Transfer uploads owner and bounded"/);
assert.match(migration, /validate_transfer_document_storage_object/);
assert.match(migration, /DOCUMENT_METADATA_MISMATCH/);
assert.match(migration, /REVOKE ALL ON FUNCTION public\.validate_transfer_document_storage_object\(\)/);

assert.match(server, /function detectTransferDocumentMimeType/);
assert.match(server, /function validateTransferDocumentUpload/);
assert.match(server, /download\(input\.storagePath\)/);
assert.match(server, /actualMimeType !== input\.mimeType/);
assert.match(server, /input\.sizeBytes !== bytes\.byteLength/);
assert.match(server, /MAX_TRANSFER_DOCUMENT_BYTES/);
assert.match(hook, /extensionByMime/);
assert.match(hook, /file\.size > 15 \* 1024 \* 1024/);
assert.match(hook, /contentType: file\.type/);
assert.match(hook, /remove\(\[storagePath\]\)/);

console.log("TRANSFER DOCUMENT STORAGE SECURITY CERTIFICATION: PASS");
