import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  BENEFICIARY_REFERENCE_PATTERN,
  type BeneficiaryDto,
  type ResolvedDestinationDto,
  type SettlementRailDto,
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

/** Supported external destinations (PROMPT 08 §20, §62). */
export const listSupportedDestinations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SettlementRailDto[]> => {
    const service = await import("@/features/beneficiaries/services/beneficiaries.server");
    return service.listSettlementRails(context.supabase);
  });

export const addExternalBeneficiary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      displayName?: string;
      bankName?: string;
      identifier?: string;
      country?: string;
      currency?: string;
      routingCode?: string;
      nickname?: string;
    }) => {
      const displayName = String(input?.displayName ?? "").trim().slice(0, 120);
      const bankName = String(input?.bankName ?? "").trim().slice(0, 120);
      if (displayName.length < 2 || bankName.length < 2) throw new Error("INVALID_DESTINATION");

      const country = String(input?.country ?? "").trim().toUpperCase();
      if (!/^[A-Z]{2}$/.test(country)) throw new Error("INVALID_DESTINATION");

      const currency = String(input?.currency ?? "").trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) throw new Error("INVALID_DESTINATION");

      const routing = String(input?.routingCode ?? "").replace(/\s+/g, "").toUpperCase().slice(0, 34);

      return {
        ...validateIdentifier(input),
        displayName,
        bankName,
        country,
        currency,
        routingCode: routing.length > 0 ? routing : null,
        nickname: normaliseNickname(input?.nickname),
      };
    },
  )
  .handler(async ({ data, context }): Promise<BeneficiaryDto> => {
    const service = await import("@/features/beneficiaries/services/beneficiaries.server");
    return service.createExternalBeneficiary(context.supabase, context.userId, data);
  });
