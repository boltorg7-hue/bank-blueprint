import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const migration = read(
  "supabase/migrations/20261111150000_address_document_security_hardening.sql",
);
const optionalDocumentsMigration = read(
  "supabase/migrations/20261112100000_optional_onboarding_documents.sql",
);
const documentRoute = read("src/routes/onboarding.documents.tsx");
const reviewRoute = read("src/routes/onboarding.review.tsx");
const taskModel = read("src/features/onboarding/lib/tasks.ts");
const statusRoute = read("src/routes/onboarding.status.tsx");
const transitionRoute = read("src/routes/onboarding.transition.tsx");
const server = read("src/features/onboarding/services/onboarding.server.ts");
const uploader = read("src/features/onboarding/components/DocumentUploader.tsx");
const schema = read("src/features/onboarding/schemas/onboarding.schemas.ts");
const addressRoute = read("src/routes/onboarding.address.tsx");

assert.match(
  migration,
  /INSERT INTO storage\.buckets[\s\S]*'identity-documents'[\s\S]*public = false/i,
);
assert.match(migration, /file_size_limit = EXCLUDED\.file_size_limit/);
assert.match(migration, /allowed_mime_types = EXCLUDED\.allowed_mime_types/);
assert.match(
  migration,
  /REVOKE INSERT, UPDATE, DELETE ON public\.customer_addresses FROM authenticated/,
);
assert.match(
  migration,
  /REVOKE INSERT, UPDATE, DELETE ON public\.verification_documents FROM authenticated/,
);
assert.match(migration, /DROP POLICY IF EXISTS "addresses insert own"/);
assert.match(migration, /DROP POLICY IF EXISTS "identity docs delete own"/);
assert.match(migration, /DROP POLICY IF EXISTS "identity docs update own"/);
assert.match(migration, /identity docs delete unregistered owner uploads/);
assert.match(migration, /vd\.storage_path = name/);
assert.match(migration, /can_access_kyc_documents\(\)/);
assert.match(migration, /public\.has_role\(auth\.uid\(\), 'kyc_agent'/);
assert.match(migration, /CREATE POLICY "identity docs upload own validated"/);
assert.match(migration, /metadata->>'mimetype'/);
assert.match(migration, /validate_verification_document_storage_object/);
assert.match(
  migration,
  /REVOKE ALL ON FUNCTION public\.validate_verification_document_storage_object\(\)\s+FROM PUBLIC, anon, authenticated/,
);
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
assert.match(schema, /originalFilename:\s*z\s*\.string\(\)\s*\.trim\(\)\s*\.min\(1\)\s*\.max\(255\)/);
assert.match(addressRoute, /saveAddressStep/);
assert.match(addressRoute, /addressStepSchema\.safeParse/);

// Initial registration may finish without KYC documents, but no KYC submission
// or banking activation is allowed until the required documents are provided.
assert.match(optionalDocumentsMigration, /SET lifecycle_state = 'IDENTITY_REQUIRED'/);
assert.match(optionalDocumentsMigration, /onboarding_step = 'COMPLETED'/);
assert.match(optionalDocumentsMigration, /RETURN QUERY SELECT _verification\.status, false/);
assert.match(
  optionalDocumentsMigration,
  /_profile\.lifecycle_state = 'ADDITIONAL_DOCUMENT_REQUIRED'/,
);
assert.match(optionalDocumentsMigration, /IDENTITY_DOCUMENT_REQUIRED/);
assert.match(optionalDocumentsMigration, /PROOF_OF_ADDRESS_REQUIRED/);
assert.match(optionalDocumentsMigration, /status = 'UPLOADED'/);
assert.match(
  optionalDocumentsMigration,
  /GRANT EXECUTE ON FUNCTION public\.customer_submit_onboarding_for_verification\(uuid\) TO service_role/,
);
assert.match(documentRoute, /Continuer sans fournir les documents pour le moment/);
assert.match(documentRoute, /canDefer/);
assert.match(reviewRoute, /const complete = isProfileComplete\(context\) && Boolean\(address\)/);
assert.match(reviewRoute, /Terminer mon inscription/);
assert.match(reviewRoute, /vérification d'identité et l'accès bancaire resteront indisponibles/);
assert.match(taskModel, /hasDeferredDocuments/);
assert.match(taskModel, /required: false/);
assert.match(taskModel, /hasDeferredDocuments\(context\)\) return "\/onboarding\/status"/);
assert.match(statusRoute, /Votre inscription est enregistrée/);
assert.match(transitionRoute, /Documents à transmettre ultérieurement/);
assert.match(transitionRoute, /Accès bancaire verrouillé jusqu'à la vérification d'identité/);

console.log("ONBOARDING ADDRESS/DOCUMENT SECURITY CERTIFICATION: PASS");
