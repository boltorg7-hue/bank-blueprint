/**
 * Customer-facing transaction read model (§76 – §79, §96).
 *
 * These DTOs hide every ledger mechanic: no ledger account id, no journal
 * entry id, no chart-of-account code, no internal note. Amounts are integer
 * minor units produced by the server.
 */

export type TransactionDirection = "INCOMING" | "OUTGOING" | "NEUTRAL";

export type CustomerTransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REVERSED";

export type CustomerTransactionDto = {
  /** Opaque public reference, e.g. TXN-2026-00000042. */
  reference: string;
  accountReference: string;
  type: string;
  direction: TransactionDirection;
  displayTitle: string;
  displayDescription: string | null;
  amountMinor: number;
  currency: string;
  minorUnit: number;
  status: CustomerTransactionStatus;
  occurredAt: string;
  completedAt: string | null;
  counterpartyDisplay: string | null;
};

export type TransactionDetailDto = CustomerTransactionDto & {
  /** Populated when this movement was reversed by a later transaction. */
  reversedByReference: string | null;
  /** Populated when this movement is itself a reversal. */
  reversalOfReference: string | null;
};

export type TransactionDateRangePreset =
  | "ALL"
  | "TODAY"
  | "LAST_7_DAYS"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "CUSTOM";

export type TransactionFilters = {
  accountReference?: string | null;
  direction?: TransactionDirection | "ALL";
  status?: CustomerTransactionStatus | "ALL";
  type?: string | "ALL";
  datePreset?: TransactionDateRangePreset;
  /** ISO dates used only when datePreset === "CUSTOM". */
  from?: string | null;
  to?: string | null;
  search?: string | null;
};

export type TransactionPageRequest = TransactionFilters & {
  page?: number;
  pageSize?: number;
};

export type TransactionPageDto = {
  items: CustomerTransactionDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
};

export type ActivitySummaryDto = {
  periodStart: string;
  periodEnd: string;
  currency: string;
  minorUnit: number;
  moneyInMinor: number;
  moneyOutMinor: number;
  netMinor: number;
  operationCount: number;
};
