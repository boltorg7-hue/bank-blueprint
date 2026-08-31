import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  STATEMENT_REFERENCE_PATTERN,
  type StatementDetailDto,
  type StatementDto,
} from "@/features/statements/types/statement";

/**
 * Statement server functions (PROMPT 09 §44 – §54).
 * Thin wrappers: the pipeline lives in statements.server.ts and is imported
 * inside the handler so nothing privileged reaches the client bundle.
 */

const ACCOUNT_PATTERN = /^ACC-\d{4}-\d{6}$/;
const MAX_PERIOD_DAYS = 400;

export const listCustomerStatements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number } | undefined) => ({
    limit: Number.isFinite(input?.limit) ? Math.min(Math.max(Number(input?.limit), 1), 60) : 24,
  }))
  .handler(async ({ data, context }): Promise<StatementDto[]> => {
    const service = await import("@/features/statements/services/statements.server");
    return service.listStatements(context.supabase, context.userId, data.limit);
  });

export const getStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reference?: string } | undefined) => {
    const reference = String(input?.reference ?? "").trim();
    if (!STATEMENT_REFERENCE_PATTERN.test(reference)) throw new Error("INVALID_REFERENCE");
    return { reference };
  })
  .handler(async ({ data, context }): Promise<StatementDetailDto | null> => {
    const service = await import("@/features/statements/services/statements.server");
    return service.getStatementDetail(context.supabase, context.userId, data.reference);
  });

export const requestAccountStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      accountReference?: string;
      periodStart?: string;
      periodEnd?: string;
      periodKind?: string;
    }) => {
      const accountReference = String(input?.accountReference ?? "").trim();
      if (!ACCOUNT_PATTERN.test(accountReference)) throw new Error("ACCOUNT_UNAVAILABLE");

      const start = new Date(String(input?.periodStart ?? ""));
      const end = new Date(String(input?.periodEnd ?? ""));
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error("INVALID_PERIOD");
      }
      if (start.getTime() >= end.getTime()) throw new Error("INVALID_PERIOD");
      if (end.getTime() > Date.now()) throw new Error("PERIOD_IN_FUTURE");
      if (end.getTime() - start.getTime() > MAX_PERIOD_DAYS * 86_400_000) {
        throw new Error("PERIOD_TOO_LONG");
      }

      const periodKind = input?.periodKind === "CUSTOM" ? "CUSTOM" : "MONTHLY";
      return {
        accountReference,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        periodKind: periodKind as "MONTHLY" | "CUSTOM",
      };
    },
  )
  .handler(async ({ data, context }): Promise<StatementDetailDto> => {
    const service = await import("@/features/statements/services/statements.server");
    return service.generateStatement(context.supabase, context.userId, data);
  });
