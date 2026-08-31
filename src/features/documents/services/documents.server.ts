/**
 * Document centre read model, receipts and authorised downloads
 * (PROMPT 09 §55 – §90).
 *
 * Server-only. Storage paths stay server-side; the browser only ever receives
 * a short-lived authorised URL bound to the owner's document (§65 – §68).
 * Every access is written to the audit trail (§85 – §89).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { DOCUMENT_BUCKET } from "@/features/statements/services/statements.server";
import type {
  CustomerDocumentDto,
  CustomerDocumentType,
  DocumentDownloadDto,
} from "@/features/documents/types/document";
import type {
  TransactionReceiptSnapshot,
  TransferReceiptSnapshot,
} from "@/features/documents/templates/receipt-pdf.server";

type Client = SupabaseClient<Database>;

const DOWNLOAD_TTL_SECONDS = 120;

type DocumentRow = {
  public_reference: string;
  document_type: string;
  title: string;
  status: string;
  source_type: string;
  source_reference: string | null;
  file_name: string | null;
  mime_type: string;
  size_bytes: number | null;
  version: number;
  generated_at: string | null;
  created_at: string;
  bank_accounts: { public_reference: string } | null;
};

const SELECT = `
  public_reference, document_type, title, status, source_type, source_reference,
  file_name, mime_type, size_bytes, version, generated_at, created_at,
  bank_accounts:account_id ( public_reference )
`;

function toDto(row: DocumentRow): CustomerDocumentDto {
  return {
    reference: row.public_reference,
    documentType: row.document_type as CustomerDocumentType,
    title: row.title,
    status: row.status as CustomerDocumentDto["status"],
    sourceType: row.source_type,
    sourceReference: row.source_reference,
    accountReference: row.bank_accounts?.public_reference ?? null,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes === null ? null : Number(row.size_bytes),
    version: row.version,
    generatedAt: row.generated_at,
    createdAt: row.created_at,
  };
}

export async function listDocuments(
  client: Client,
  userId: string,
  options: { types?: CustomerDocumentType[] | null; limit?: number } = {},
): Promise<CustomerDocumentDto[]> {
  let query = client
    .from("customer_documents")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 40);

  if (options.types && options.types.length > 0) {
    query = query.in("document_type", options.types as never);
  }

  const { data, error } = await query;
  if (error) throw new Error("DOCUMENT_UNAVAILABLE");
  return ((data ?? []) as unknown as DocumentRow[]).map(toDto);
}

export async function getDocument(
  client: Client,
  userId: string,
  reference: string,
): Promise<CustomerDocumentDto | null> {
  const { data, error } = await client
    .from("customer_documents")
    .select(SELECT)
    .eq("user_id", userId)
    .eq("public_reference", reference)
    .maybeSingle();
  if (error) throw new Error("DOCUMENT_UNAVAILABLE");
  if (!data) return null;
  return toDto(data as unknown as DocumentRow);
}

/** Finds the receipt already generated for a banking object, if any (§82). */
export async function findReceiptForSource(
  client: Client,
  userId: string,
  documentType: CustomerDocumentType,
  sourceReference: string,
): Promise<CustomerDocumentDto | null> {
  const { data, error } = await client
    .from("customer_documents")
    .select(SELECT)
    .eq("user_id", userId)
    .eq("document_type", documentType as never)
    .eq("source_reference", sourceReference)
    .eq("status", "READY" as never)
    .order("version", { ascending: false })
    .limit(1);
  if (error) throw new Error("DOCUMENT_UNAVAILABLE");
  const rows = (data ?? []) as unknown as DocumentRow[];
  return rows[0] ? toDto(rows[0]) : null;
}

function receiptFailureCode(message: string): string {
  const known = [
    "RECEIPT_NOT_AVAILABLE",
    "RECEIPT_NOT_SUPPORTED",
    "TRANSFER_UNAVAILABLE",
    "TRANSACTION_UNAVAILABLE",
    "DOCUMENT_UNAVAILABLE",
  ];
  return known.find((code) => message.includes(code)) ?? "GENERATION_FAILED";
}

/**
 * Generates (or reuses) the definitive receipt of a completed operation.
 * Eligibility is decided in SQL: nothing provisional can produce a receipt
 * (§78 – §81).
 */
export async function generateReceipt(
  client: Client,
  userId: string,
  documentType: Extract<CustomerDocumentType, "TRANSFER_RECEIPT" | "TRANSACTION_RECEIPT">,
  sourceReference: string,
): Promise<CustomerDocumentDto> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const prepared = await supabaseAdmin.rpc("prepare_customer_receipt", {
    _user_id: userId,
    _document_type: documentType,
    _source_reference: sourceReference,
  } as never);
  if (prepared.error) throw new Error(receiptFailureCode(prepared.error.message));

  const row = (Array.isArray(prepared.data) ? prepared.data[0] : prepared.data) as
    | { reference: string; reused: boolean; title: string; snapshot: unknown }
    | undefined;
  if (!row?.reference) throw new Error("GENERATION_FAILED");

  if (!row.reused) {
    try {
      const templates = await import("@/features/documents/templates/receipt-pdf.server");
      const pdf =
        documentType === "TRANSFER_RECEIPT"
          ? await templates.renderTransferReceiptPdf(
              row.reference,
              row.snapshot as TransferReceiptSnapshot,
            )
          : await templates.renderTransactionReceiptPdf(
              row.reference,
              row.snapshot as TransactionReceiptSnapshot,
            );

      const storagePath = `${userId}/receipts/${row.reference}.pdf`;
      const upload = await supabaseAdmin.storage
        .from(DOCUMENT_BUCKET)
        .upload(storagePath, pdf.bytes, {
          contentType: pdf.mimeType,
          cacheControl: "0",
          upsert: true,
        });
      if (upload.error) throw new Error("GENERATION_FAILED");

      const finalized = await supabaseAdmin.rpc("finalize_customer_document", {
        _user_id: userId,
        _document_reference: row.reference,
        _storage_path: storagePath,
        _file_name: pdf.fileName,
        _mime_type: pdf.mimeType,
        _size_bytes: pdf.sizeBytes,
        _checksum: pdf.checksum,
      } as never);
      if (finalized.error) throw new Error("GENERATION_FAILED");
    } catch (error) {
      const code =
        error instanceof Error ? receiptFailureCode(error.message) : "GENERATION_FAILED";
      await supabaseAdmin.rpc("fail_customer_document", {
        _user_id: userId,
        _document_reference: row.reference,
        _failure_code: code,
      } as never);
      throw new Error(code);
    }
  }

  const document = await getDocument(client, userId, row.reference);
  if (!document) throw new Error("DOCUMENT_UNAVAILABLE");
  return document;
}

/**
 * Issues a short-lived authorised URL for a READY document owned by the
 * caller, and records the access (§66, §85).
 */
export async function createDocumentDownload(
  userId: string,
  reference: string,
  intent: "download" | "preview",
): Promise<DocumentDownloadDto> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: row, error } = await supabaseAdmin
    .from("customer_documents")
    .select("storage_path, file_name, status, user_id")
    .eq("public_reference", reference)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("DOCUMENT_UNAVAILABLE");
  if (!row) throw new Error("DOCUMENT_UNAVAILABLE");
  if (row.status !== "READY" || !row.storage_path) {
    throw new Error("DOCUMENT_FILE_UNAVAILABLE");
  }

  const signed = await supabaseAdmin.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(row.storage_path, DOWNLOAD_TTL_SECONDS, {
      ...(intent === "download" ? { download: row.file_name ?? `${reference}.pdf` } : {}),
    });
  if (signed.error || !signed.data?.signedUrl) {
    throw new Error("DOCUMENT_FILE_UNAVAILABLE");
  }

  await supabaseAdmin.rpc("record_document_event", {
    _user_id: userId,
    _document_reference: reference,
    _event_type: intent === "download" ? "document_downloaded" : "document_previewed",
    _context: {},
  } as never);

  return {
    url: signed.data.signedUrl,
    fileName: row.file_name ?? `${reference}.pdf`,
    expiresInSeconds: DOWNLOAD_TTL_SECONDS,
  };
}
