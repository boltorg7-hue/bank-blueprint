import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DOCUMENT_REFERENCE_PATTERN,
  type CustomerDocumentDto,
  type CustomerDocumentType,
  type DocumentDownloadDto,
} from "@/features/documents/types/document";

/**
 * Document centre server functions (PROMPT 09 §55 – §90).
 * Thin wrappers only; privileged storage access lives in documents.server.ts.
 */

const RECEIPT_TYPES = ["TRANSFER_RECEIPT", "TRANSACTION_RECEIPT"] as const;
const TRANSFER_PATTERN = /^TRF-\d{4}-\d{8}$/;
const TRANSACTION_PATTERN = /^TXN-\d{4}-\d{8}$/;

export const listCustomerDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { types?: string[]; limit?: number } | undefined) => {
    const allowed: CustomerDocumentType[] = [
      "ACCOUNT_STATEMENT",
      "TRANSFER_RECEIPT",
      "TRANSACTION_RECEIPT",
      "BANK_LETTER",
      "ACCOUNT_CERTIFICATE",
    ];
    const types = (input?.types ?? []).filter((type): type is CustomerDocumentType =>
      (allowed as string[]).includes(type),
    );
    return {
      types,
      limit: Number.isFinite(input?.limit) ? Math.min(Math.max(Number(input?.limit), 1), 80) : 40,
    };
  })
  .handler(async ({ data, context }): Promise<CustomerDocumentDto[]> => {
    const service = await import("@/features/documents/services/documents.server");
    return service.listDocuments(context.supabase, context.userId, {
      types: data.types.length > 0 ? data.types : null,
      limit: data.limit,
    });
  });

export const getCustomerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reference?: string } | undefined) => {
    const reference = String(input?.reference ?? "").trim();
    if (!DOCUMENT_REFERENCE_PATTERN.test(reference)) throw new Error("DOCUMENT_UNAVAILABLE");
    return { reference };
  })
  .handler(async ({ data, context }): Promise<CustomerDocumentDto | null> => {
    const service = await import("@/features/documents/services/documents.server");
    return service.getDocument(context.supabase, context.userId, data.reference);
  });

/** Existing receipt for a completed operation, without generating one (§82). */
export const findOperationReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentType?: string; sourceReference?: string }) => {
    const documentType = String(input?.documentType ?? "");
    if (!(RECEIPT_TYPES as readonly string[]).includes(documentType)) {
      throw new Error("RECEIPT_NOT_SUPPORTED");
    }
    const sourceReference = String(input?.sourceReference ?? "").trim();
    const pattern = documentType === "TRANSFER_RECEIPT" ? TRANSFER_PATTERN : TRANSACTION_PATTERN;
    if (!pattern.test(sourceReference)) throw new Error("INVALID_SOURCE_REFERENCE");
    return {
      documentType: documentType as (typeof RECEIPT_TYPES)[number],
      sourceReference,
    };
  })
  .handler(async ({ data, context }): Promise<CustomerDocumentDto | null> => {
    const service = await import("@/features/documents/services/documents.server");
    return service.findReceiptForSource(
      context.supabase,
      context.userId,
      data.documentType,
      data.sourceReference,
    );
  });

export const generateOperationReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentType?: string; sourceReference?: string }) => {
    const documentType = String(input?.documentType ?? "");
    if (!(RECEIPT_TYPES as readonly string[]).includes(documentType)) {
      throw new Error("RECEIPT_NOT_SUPPORTED");
    }
    const sourceReference = String(input?.sourceReference ?? "").trim();
    const pattern = documentType === "TRANSFER_RECEIPT" ? TRANSFER_PATTERN : TRANSACTION_PATTERN;
    if (!pattern.test(sourceReference)) throw new Error("INVALID_SOURCE_REFERENCE");
    return {
      documentType: documentType as (typeof RECEIPT_TYPES)[number],
      sourceReference,
    };
  })
  .handler(async ({ data, context }): Promise<CustomerDocumentDto> => {
    const service = await import("@/features/documents/services/documents.server");
    return service.generateReceipt(
      context.supabase,
      context.userId,
      data.documentType,
      data.sourceReference,
    );
  });

export const authoriseDocumentAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reference?: string; intent?: string }) => {
    const reference = String(input?.reference ?? "").trim();
    if (!DOCUMENT_REFERENCE_PATTERN.test(reference)) throw new Error("DOCUMENT_UNAVAILABLE");
    return {
      reference,
      intent: input?.intent === "preview" ? ("preview" as const) : ("download" as const),
    };
  })
  .handler(async ({ data, context }): Promise<DocumentDownloadDto> => {
    const service = await import("@/features/documents/services/documents.server");
    return service.createDocumentDownload(context.userId, data.reference, data.intent);
  });
