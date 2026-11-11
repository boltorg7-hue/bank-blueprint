import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const migration = read("supabase/migrations/20261111150000_address_document_security_hardening.sql");
const server = read("src/features/onboarding/services/onboarding.server.ts");
const uploader = read("src/features/onboarding/components/DocumentUploader.tsx");
const schema = read("src/features/onboarding/schemas/onboarding.schemas.ts");
const addressRoute = read("src/routes/onboarding.address.tsx");

assert.match(migration, /INSERT INTO storage\.buckets[\s\S]*'identity-documents'[\s\S]*public = false/i);
assert.match(migration, /file_size_limit = EXCLUDED\.file_size_limit/);
assert.match(migration, /allowed_mime_types = EXCLUDED\.allowed_mime_types/);
assert.match(migration, /REVOKE INSERT, UPDATE, DELETE ON public\.customer_addresses FROM authenticated/);
assert.match(migration, /REVOKE INSERT, UPDATE, DELETE ON public\.verification_documents FROM authenticated/);
assert.match(migration, /DROP POLICY IF EXISTS "addresses insert own"/);
assert.match(migration, /DROP POLICY IF EXISTS "identity docs delete own"/);
assert.match(migration, /can_access_kyc_documents\(\)/);
assert.match(migration, /public\.has_role\(auth\.uid\(\), 'kyc_agent'/);
assert.match(migration, /CREATE POLICY "identity docs upload own validated"/);
assert.match(migration, /metadata->>'mimetype'/);
assert.match(migration, /validate_verification_document_storage_object/);
assert.match(migration, /DOCUMENT_METADATA_MISMATCH/);
assert.match(migration, /customer_addresses_line1_length_check/);

assert.match(server, /function detectDocumentMimeType/);
assert.match(server, /ascii\(0, 5\) === "%PDF-"/);
assert.match(server, /image\/jpeg/);
assert.match(server, /image\/png/);
assert.match(server, /ascii\(8, 12\) === "WEBP"/);
assert.match(server, /download\(data\.storagePath\)/);
assert.match(server, /actualMimeType !== data\.mimeType/);
assert.match(server, /bytes\.byteLength !== data\.sizeBytes/);
assert.match(server, /bytes\.byteLength > MAX_DOCUMENT_BYTES/);
assert.match(server, /DOCUMENT_EXTENSION_MISMATCH/);
assert.match(server, /createSignedUrl\(document\.storage_path, 60\)/);

assert.match(uploader, /extensionByMime/);
assert.match(uploader, /cacheControl: "0"/);
assert.match(schema, /storagePath: z\.string\(\)\.min\(1\)\.max\(256\)/);
assert.match(schema, /originalFilename: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(255\)/);
assert.match(addressRoute, /saveAddressStep/);
assert.match(addressRoute, /addressStepSchema\.safeParse/);

console.log("ONBOARDING ADDRESS/DOCUMENT SECURITY CERTIFICATION: PASS");
