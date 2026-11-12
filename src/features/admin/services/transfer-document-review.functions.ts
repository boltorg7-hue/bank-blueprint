import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AdminExternalTransferReviewPageDto } from "@/features/admin/types/transfer-document-review";

function cursorInput(input: { cursor?: string | null } | undefined) {
  return { cursor: input?.cursor ? String(input.cursor).slice(0, 512) : null };
}

export const listAdminExternalTransfersWithDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(cursorInput)
  .handler(async ({ data, context }): Promise<AdminExternalTransferReviewPageDto> => {
    const adminService = await import("@/features/admin/services/admin.server");
    const documentService = await import("@/features/admin/services/transfer-document-review.server");
    const page = await adminService.loadExternalTransfers(context.supabase, data.cursor);
    const documents = await documentService.loadTransferDocumentsForReferences(
      context.supabase,
      page.items.map((item) => item.reference),
    );
    return {
      ...page,
      items: page.items.map((item) => ({
        ...item,
        documents: documents.get(item.reference) ?? [],
      })),
    };
  });

export const getAdminTransferDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentId: string }) => {
    const documentId = String(input?.documentId ?? "").trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId)) {
      throw new Error("INVALID_DOCUMENT_REFERENCE");
    }
    return { documentId };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/transfer-document-review.server");
    return service.createAdminTransferDocumentUrl(context.supabase, data.documentId);
  });

export const reviewAdminTransferDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentId: string; accept: boolean; reason?: string }) => {
    const documentId = String(input?.documentId ?? "").trim();
    const accept = input?.accept;
    const reason = String(input?.reason ?? "").trim();
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId) ||
      typeof accept !== "boolean" ||
      (!accept && (reason.length < 8 || reason.length > 500))
    ) {
      throw new Error("INVALID_DOCUMENT_REVIEW");
    }
    return { documentId, accept, reason };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/transfer-document-review.server");
    return service.reviewAdminTransferDocument(context.supabase, context.userId, data);
  });
