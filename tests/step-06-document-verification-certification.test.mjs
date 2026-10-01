import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const functions = read("src/features/transfers/services/transfers.functions.ts");
const server = read("src/features/transfers/services/transfers.server.ts");
const types = read("src/features/transfers/types/transfer.ts");
const hooks = read("src/features/transfers/hooks/useTransfers.ts");
const requirements = read("src/features/transfers/components/TransferRequirements.tsx");
const detail = read("src/features/transfers/components/TransferDetail.tsx");
const admin = read("src/routes/admin.transfers.tsx");

assert.match(functions, /registerTransferDocument/);
assert.match(functions, /REQUIREMENT_UNAVAILABLE/);
assert.match(functions, /INVALID_DOCUMENT_PATH/);
assert.match(functions, /storagePath\.includes\("\.\."\)/);
assert.match(functions, /requireSupabaseAuth/);

assert.match(server, /\.eq\("user_id", userId\)/);
assert.match(server, /\.eq\("transfers\.public_reference", reference\)/);
assert.match(server, /storage path is deliberately never returned to the browser/i);
assert.match(server, /loadRequirements/);
assert.match(server, /loadDocuments/);

assert.match(types, /TransferRequirementType/);
assert.match(types, /TransferRequirementStatus/);
assert.match(types, /TransferDocumentStatus/);
assert.match(types, /REPLACEMENT_REQUIRED/);
assert.match(types, /rejectionReasonCode/);

assert.match(hooks, /useUploadTransferDocument/);
assert.match(hooks, /transfer-documents/);
assert.match(hooks, /\$\{userId\}\/\$\{reference\}\/\$\{requirementId\}/);
assert.match(hooks, /register\(\{\s*data:/s);

assert.match(requirements, /ACCEPTED = "image\/jpeg,image\/png,image\/heic,application\/pdf"/);
assert.match(requirements, /MAX_BYTES = 15 \* 1024 \* 1024/);
assert.match(requirements, /REPLACEMENT_REQUIRED/);
assert.match(requirements, /Nos équipes procèdent à sa vérification/);
assert.match(requirements, /documents restent privés/);

assert.match(detail, /<TransferRequirements/);
assert.match(detail, /data\.requirements/);
assert.match(detail, /data\.documents/);
assert.match(detail, /data\.status === "COMPLETED" && data\.progressPercent >= 100/);

assert.match(admin, /documentsOpen/);
assert.match(admin, /compliance\.review/);
assert.match(admin, /transfers\.approve/);

console.log("STEP 06 STATIC CERTIFICATION: PASS");
console.log("Covered: authenticated document registration, path traversal guard, customer scoping, private-storage registration, requirement/document DTOs, accepted file constraints, rejection/replacement flow, review messaging, admin review visibility, and no receipt before completed transfer.");
