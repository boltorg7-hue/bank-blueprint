import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  BENEFICIARY_REFERENCE_PATTERN,
  type BeneficiaryDto,
  type ResolvedDestinationDto,
} from "@/features/beneficiaries/types/beneficiary";

/**
 * Beneficiary server functions. Thin wrappers only: every runtime helper lives
 * in beneficiaries.server.ts and is imported inside the handler.
 */

function validateIdentifier(input: { identifier?: string } | undefined): { identifier: string } {
  const identifier = String(input?.identifier ?? "")
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 40);
  if (!/^[A-Z0-9-]{6,40}$/.test(identifier)) throw new Error("INVALID_IDENTIFIER");
  return { identifier };
}

function validateReference(input: { reference?: string } | undefined): { reference: string } {
  const reference = String(input?.reference ?? "").trim();
  if (!BENEFICIARY_REFERENCE_PATTERN.test(reference)) throw new Error("INVALID_BENEFICIARY_REFERENCE");
  return { reference };
}

function normaliseNickname(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 60);
  return trimmed.length > 0 ? trimmed : null;
}

export const listCustomerBeneficiaries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BeneficiaryDto[]> => {
    const service = await import("@/features/beneficiaries/services/beneficiaries.server");
    return service.listBeneficiaries(context.supabase, context.userId);
  });

export const resolveBeneficiaryDestination = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateIdentifier)
  .handler(async ({ data, context }): Promise<ResolvedDestinationDto | null> => {
    const service = await import("@/features/beneficiaries/services/beneficiaries.server");
    return service.resolveDestination(context.userId, data.identifier);
  });

export const addBeneficiary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { identifier?: string; nickname?: string } | undefined) => ({
    ...validateIdentifier(input),
    nickname: normaliseNickname(input?.nickname),
  }))
  .handler(async ({ data, context }): Promise<BeneficiaryDto> => {
    const service = await import("@/features/beneficiaries/services/beneficiaries.server");
    return service.createBeneficiary(
      context.supabase,
      context.userId,
      data.identifier,
      data.nickname,
    );
  });

export const deleteBeneficiary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateReference)
  .handler(async ({ data, context }): Promise<{ reference: string }> => {
    const service = await import("@/features/beneficiaries/services/beneficiaries.server");
    await service.removeBeneficiary(context.userId, data.reference);
    return { reference: data.reference };
  });

export const updateBeneficiaryNickname = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reference?: string; nickname?: string } | undefined) => ({
    ...validateReference(input),
    nickname: normaliseNickname(input?.nickname),
  }))
  .handler(async ({ data, context }): Promise<{ reference: string }> => {
    const service = await import("@/features/beneficiaries/services/beneficiaries.server");
    await service.renameBeneficiary(context.userId, data.reference, data.nickname);
    return { reference: data.reference };
  });
