import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  CustomerTransactionDto,
  TransactionDetailDto,
  TransactionPageDto,
  TransactionPageRequest,
} from "@/features/transactions/types/transaction";

/**
 * Customer transaction server functions. Thin wrappers only: every runtime
 * helper lives in transactions.server.ts and is imported inside the handler.
 *
 * These are READ endpoints. No financial command is exposed here: posting,
 * reversal and holds stay inside the trusted ledger boundary (§111, §116).
 */

const DIRECTIONS = ["ALL", "INCOMING", "OUTGOING", "NEUTRAL"] as const;
const STATUSES = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "REVERSED",
] as const;
const PRESETS = ["ALL", "TODAY", "LAST_7_DAYS", "THIS_MONTH", "LAST_MONTH", "CUSTOM"] as const;

function validatePageRequest(input: TransactionPageRequest | undefined): TransactionPageRequest {
  const raw = input ?? {};
  const accountReference = raw.accountReference?.trim() || null;
  if (accountReference && !/^ACC-\d{4}-\d{6}$/.test(accountReference)) {
    throw new Error("INVALID_ACCOUNT_REFERENCE");
  }
  const direction = DIRECTIONS.includes(raw.direction as never) ? raw.direction! : "ALL";
  const status = STATUSES.includes(raw.status as never) ? raw.status! : "ALL";
  const datePreset = PRESETS.includes(raw.datePreset as never) ? raw.datePreset! : "ALL";
  const type = typeof raw.type === "string" && /^[A-Z_]{3,32}$/.test(raw.type) ? raw.type : "ALL";
  const search = typeof raw.search === "string" ? raw.search.slice(0, 64) : null;

  return {
    accountReference,
    direction,
    status,
    type,
    datePreset,
    from: typeof raw.from === "string" ? raw.from : null,
    to: typeof raw.to === "string" ? raw.to : null,
    search,
    page: Number.isFinite(raw.page) ? Math.max(Number(raw.page), 1) : 1,
    ...(Number.isFinite(raw.pageSize) ? { pageSize: Number(raw.pageSize) } : {}),
  };
}

export const listTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TransactionPageRequest | undefined) => validatePageRequest(input))
  .handler(async ({ data, context }): Promise<TransactionPageDto> => {
    const service = await import("@/features/transactions/services/transactions.server");
    return service.getTransactions(context.supabase, data);
  });

export const getAccountActivityFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { accountReference?: string | null; limit?: number } | undefined) => {
    const accountReference = input?.accountReference?.trim() || null;
    if (accountReference && !/^ACC-\d{4}-\d{6}$/.test(accountReference)) {
      throw new Error("INVALID_ACCOUNT_REFERENCE");
    }
    const limit = Number.isFinite(input?.limit) ? Math.min(Math.max(Number(input?.limit), 1), 20) : 5;
    return { accountReference, limit };
  })
  .handler(async ({ data, context }): Promise<CustomerTransactionDto[]> => {
    const service = await import("@/features/transactions/services/transactions.server");
    return service.getAccountActivity(context.supabase, data.accountReference, data.limit);
  });

export const getTransactionDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reference: string }) => {
    const reference = String(input?.reference ?? "").trim();
    if (!/^TXN-\d{4}-\d{8}$/.test(reference)) throw new Error("INVALID_TRANSACTION_REFERENCE");
    return { reference };
  })
  .handler(async ({ data, context }): Promise<TransactionDetailDto | null> => {
    const service = await import("@/features/transactions/services/transactions.server");
    return service.getTransactionDetails(context.supabase, data.reference);
  });
