import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BENEFICIARY_REFERENCE_PATTERN } from "@/features/beneficiaries/types/beneficiary";
import {
  TRANSFER_REFERENCE_PATTERN,
  type TransferConfirmationResultDto,
  type TransferDetailDto,
  type TransferDto,
  type TransferLimitsDto,
  type TransferStatus,
} from "@/features/transfers/types/transfer";

/**
 * Transfer server functions. Thin wrappers only: every runtime helper lives in
 * transfers.server.ts and is imported inside the handler. The client never
 * computes, reserves or posts anything (§100, §116).
 */

const ACCOUNT_PATTERN = /^ACC-\d{4}-\d{6}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireTransferReference(input: { reference?: string } | undefined): { reference: string } {
  const reference = String(input?.reference ?? "").trim();
  if (!TRANSFER_REFERENCE_PATTERN.test(reference)) throw new Error("INVALID_TRANSFER_REFERENCE");
  return { reference };
}

export const listCustomerTransfers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number } | undefined) => ({
    limit: Number.isFinite(input?.limit) ? Math.min(Math.max(Number(input?.limit), 1), 100) : 30,
  }))
  .handler(async ({ data, context }): Promise<TransferDto[]> => {
    const service = await import("@/features/transfers/services/transfers.server");
    return service.listTransfers(context.supabase, context.userId, data.limit);
  });

export const getTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(requireTransferReference)
  .handler(async ({ data, context }): Promise<TransferDetailDto | null> => {
    const service = await import("@/features/transfers/services/transfers.server");
    return service.getTransferDetail(context.supabase, context.userId, data.reference);
  });

export const getTransferLimitsForCurrency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { currency?: string } | undefined) => {
    const currency = String(input?.currency ?? "").toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error("INVALID_CURRENCY");
    return { currency };
  })
  .handler(async ({ data, context }): Promise<TransferLimitsDto | null> => {
    const service = await import("@/features/transfers/services/transfers.server");
    return service.getTransferLimits(context.supabase, data.currency);
  });

export const initiateTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      sourceAccountReference?: string;
      beneficiaryReference?: string;
      amountMinor?: number;
      customerReference?: string;
    }) => {
      const sourceAccountReference = String(input?.sourceAccountReference ?? "").trim();
      if (!ACCOUNT_PATTERN.test(sourceAccountReference)) throw new Error("INVALID_ACCOUNT_REFERENCE");

      const beneficiaryReference = String(input?.beneficiaryReference ?? "").trim();
      if (!BENEFICIARY_REFERENCE_PATTERN.test(beneficiaryReference)) {
        throw new Error("INVALID_BENEFICIARY_REFERENCE");
      }

      const amountMinor = Number(input?.amountMinor);
      if (!Number.isInteger(amountMinor) || amountMinor <= 0) throw new Error("INVALID_AMOUNT");

      const note = typeof input?.customerReference === "string" ? input.customerReference.trim() : "";
      return {
        sourceAccountReference,
        beneficiaryReference,
        amountMinor,
        customerReference: note.length > 0 ? note.slice(0, 140) : null,
      };
    },
  )
  .handler(async ({ data, context }): Promise<TransferDetailDto> => {
    const service = await import("@/features/transfers/services/transfers.server");
    return service.createTransfer(context.supabase, context.userId, data);
  });

export const confirmTransferExecution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(requireTransferReference)
  .handler(async ({ data, context }): Promise<TransferConfirmationResultDto> => {
    const service = await import("@/features/transfers/services/transfers.server");
    return service.confirmTransfer(context.userId, data.reference);
  });

export const cancelTransferIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(requireTransferReference)
  .handler(async ({ data, context }): Promise<{ reference: string; status: TransferStatus }> => {
    const service = await import("@/features/transfers/services/transfers.server");
    return service.cancelTransfer(context.userId, data.reference);
  });

/**
 * Registers a document the customer has just uploaded to their private folder
 * of the transfer bucket (PROMPT 08 §35, §97). The file itself never transits
 * through this function; only its owner-scoped path does, and the routine
 * re-checks that the path belongs to the caller.
 */
export const registerTransferDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      reference?: string;
      requirementId?: string;
      storagePath?: string;
      originalFilename?: string;
      mimeType?: string;
      sizeBytes?: number;
    }) => {
      const { reference } = requireTransferReference(input);

      const requirementId = String(input?.requirementId ?? "").trim();
      if (!UUID_PATTERN.test(requirementId)) throw new Error("REQUIREMENT_UNAVAILABLE");

      const storagePath = String(input?.storagePath ?? "").trim();
      if (storagePath.length < 8 || storagePath.length > 400 || storagePath.includes("..")) {
        throw new Error("INVALID_DOCUMENT_PATH");
      }

      const filename = String(input?.originalFilename ?? "").trim().slice(0, 200);
      const mimeType = String(input?.mimeType ?? "").trim().slice(0, 100);
      const size = Number(input?.sizeBytes);

      return {
        reference,
        requirementId,
        storagePath,
        originalFilename: filename.length > 0 ? filename : null,
        mimeType: mimeType.length > 0 ? mimeType : null,
        sizeBytes: Number.isInteger(size) && size > 0 ? size : null,
      };
    },
  )
  .handler(async ({ data, context }): Promise<TransferDetailDto> => {
    const service = await import("@/features/transfers/services/transfers.server");
    return service.registerTransferDocument(context.supabase, context.userId, data);
  });

/**
 * Pulls the authoritative settlement status of an external transfer (§55).
 * A pending or unknown answer leaves the transfer exactly where it is.
 */
export const refreshTransferSettlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(requireTransferReference)
  .handler(async ({ data, context }): Promise<TransferDetailDto | null> => {
    const service = await import("@/features/transfers/services/transfers.server");
    return service.syncSettlement(context.supabase, context.userId, data.reference);
  });
