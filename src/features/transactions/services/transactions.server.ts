/**
 * Customer transaction read services (§109, §112).
 *
 * Every query goes through the request-scoped Supabase client, so the
 * customer-safe view `customer_account_activity` runs with the signed-in
 * customer's privileges: rows belonging to another customer simply do not
 * exist for this request. No privileged credential is used here.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ActivitySummaryDto,
  CustomerTransactionDto,
  CustomerTransactionStatus,
  TransactionDetailDto,
  TransactionDirection,
  TransactionPageDto,
  TransactionPageRequest,
} from "@/features/transactions/types/transaction";
import { transactionTypeLabel } from "@/features/transactions/utils/transaction-display";

type Client = SupabaseClient<any, any, any>;

export class TransactionAccessError extends Error {}

const VIEW = "customer_account_activity";
const COLUMNS =
  "reference, account_reference, transaction_type, direction, amount_minor, currency, minor_unit, display_description, counterparty_display, status, occurred_at, completed_at, source_type, entry_id";

export const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 50;

type ActivityRow = {
  reference: string;
  account_reference: string;
  transaction_type: string;
  direction: TransactionDirection;
  amount_minor: number | string;
  currency: string;
  minor_unit: number;
  display_description: string | null;
  counterparty_display: string | null;
  status: CustomerTransactionStatus;
  occurred_at: string;
  completed_at: string | null;
  source_type: string;
  entry_id: string;
};

function toDto(row: ActivityRow): CustomerTransactionDto {
  return {
    reference: row.reference,
    accountReference: row.account_reference,
    type: row.transaction_type,
    direction: row.direction,
    displayTitle: transactionTypeLabel(row.transaction_type, row.direction),
    displayDescription: row.display_description,
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    minorUnit: row.minor_unit,
    status: row.status,
    occurredAt: row.occurred_at,
    completedAt: row.completed_at,
    counterpartyDisplay: row.counterparty_display,
  };
}

/** Resolves a date-range preset into an absolute window (§92). */
export function resolveDateRange(
  request: TransactionPageRequest,
  now: Date = new Date(),
): { from: string | null; to: string | null } {
  const startOfDay = (date: Date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  switch (request.datePreset ?? "ALL") {
    case "TODAY": {
      const from = startOfDay(now);
      const to = new Date(from.getTime() + 86_400_000);
      return { from: from.toISOString(), to: to.toISOString() };
    }
    case "LAST_7_DAYS": {
      const to = new Date(startOfDay(now).getTime() + 86_400_000);
      const from = new Date(to.getTime() - 7 * 86_400_000);
      return { from: from.toISOString(), to: to.toISOString() };
    }
    case "THIS_MONTH": {
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      return { from: from.toISOString(), to: to.toISOString() };
    }
    case "LAST_MONTH": {
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { from: from.toISOString(), to: to.toISOString() };
    }
    case "CUSTOM":
      return { from: request.from ?? null, to: request.to ?? null };
    default:
      return { from: null, to: null };
  }
}

function applyFilters(query: any, request: TransactionPageRequest) {
  if (request.accountReference) query = query.eq("account_reference", request.accountReference);
  if (request.direction && request.direction !== "ALL") {
    query = query.eq("direction", request.direction);
  }
  if (request.status && request.status !== "ALL") query = query.eq("status", request.status);
  if (request.type && request.type !== "ALL") query = query.eq("transaction_type", request.type);

  const { from, to } = resolveDateRange(request);
  if (from) query = query.gte("occurred_at", from);
  if (to) query = query.lt("occurred_at", to);

  const search = request.search?.trim();
  if (search) {
    // Customer-safe fields only (§91): reference, description, counterparty.
    const escaped = search.replace(/[,%()]/g, " ");
    query = query.or(
      `reference.ilike.%${escaped}%,display_description.ilike.%${escaped}%,counterparty_display.ilike.%${escaped}%`,
    );
  }
  return query;
}

/** Paginated history, newest first with a deterministic tiebreaker (§86 – §88). */
export async function getTransactions(
  client: Client,
  request: TransactionPageRequest,
): Promise<TransactionPageDto> {
  const pageSize = Math.min(Math.max(request.pageSize ?? DEFAULT_PAGE_SIZE, 5), MAX_PAGE_SIZE);
  const page = Math.max(request.page ?? 1, 1);
  const offset = (page - 1) * pageSize;

  let query = client.from(VIEW).select(COLUMNS, { count: "exact" });
  query = applyFilters(query, request);
  query = query
    .order("occurred_at", { ascending: false })
    .order("entry_id", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new TransactionAccessError("ACTIVITY_UNAVAILABLE");

  const items = ((data ?? []) as unknown as ActivityRow[]).map(toDto);
  const totalCount = count ?? items.length;
  return {
    items,
    page,
    pageSize,
    totalCount,
    hasMore: offset + items.length < totalCount,
  };
}

/** Short activity feed for the dashboard and account details (§101). */
export async function getAccountActivity(
  client: Client,
  accountReference: string | null,
  limit = 5,
): Promise<CustomerTransactionDto[]> {
  const page = await getTransactions(client, {
    accountReference,
    pageSize: Math.min(Math.max(limit, 5), MAX_PAGE_SIZE),
    page: 1,
  });
  return page.items.slice(0, limit);
}

/**
 * Transaction detail. A reference belonging to another customer resolves to
 * null, exactly like an unknown reference (§151).
 */
export async function getTransactionDetails(
  client: Client,
  reference: string,
): Promise<TransactionDetailDto | null> {
  const { data, error } = await client
    .from(VIEW)
    .select(COLUMNS)
    .eq("reference", reference)
    .order("occurred_at", { ascending: false });
  if (error) throw new TransactionAccessError("TRANSACTION_UNAVAILABLE");

  const rows = (data ?? []) as unknown as ActivityRow[];
  const row = rows[0];
  if (!row) return null;

  const base = toDto(row);

  // Customer-safe links between an operation and its reversal (§98).
  const { data: reversalRows } = await client
    .from(VIEW)
    .select("reference, transaction_type, source_type, display_description, occurred_at")
    .eq("transaction_type", "REVERSAL")
    .ilike("display_description", `%${reference}%`)
    .limit(1);

  const reversedBy = (reversalRows ?? [])[0] as { reference: string } | undefined;

  return {
    ...base,
    reversedByReference:
      base.status === "REVERSED" ? (reversedBy?.reference ?? null) : null,
    reversalOfReference: null,
  };
}

/** Server-side monthly aggregate: money in / money out (§102 – §105, §141). */
export async function getMonthlyActivitySummary(
  client: Client,
  accountReference: string,
  currency: string,
  minorUnit: number,
  now: Date = new Date(),
): Promise<ActivitySummaryDto> {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const { data, error } = await client.rpc("customer_monthly_activity_summary", {
    _account_reference: accountReference,
    _period_start: periodStart.toISOString(),
    _period_end: periodEnd.toISOString(),
  });
  if (error) throw new TransactionAccessError("SUMMARY_UNAVAILABLE");

  const row = (Array.isArray(data) ? data[0] : data) as
    | { money_in_minor: number | string; money_out_minor: number | string; operation_count: number | string }
    | undefined;

  const moneyInMinor = Number(row?.money_in_minor ?? 0);
  const moneyOutMinor = Number(row?.money_out_minor ?? 0);

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    currency,
    minorUnit,
    moneyInMinor,
    moneyOutMinor,
    netMinor: moneyInMinor - moneyOutMinor,
    operationCount: Number(row?.operation_count ?? 0),
  };
}
