/**
 * Ledger domain types (PROMPT 06 §184, §185).
 *
 * This module is the accounting vocabulary of the platform. It is internal:
 * none of these shapes may be rendered to a customer as-is (§96).
 *
 * All amounts are integer MINOR units. Direction is carried by the explicit
 * debit/credit side, never by a negative amount (§27).
 */

export type LedgerAccountClass = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type LedgerSide = "DEBIT" | "CREDIT";

export type LedgerAccountStatus = "ACTIVE" | "INACTIVE" | "CLOSED";

export type LedgerTransactionStatus = "DRAFT" | "POSTED";

export type LedgerTransactionType =
  | "ACCOUNT_OPENING"
  | "TRANSFER"
  | "FUNDING"
  | "FEE"
  | "REFUND"
  | "ADJUSTMENT"
  | "REVERSAL";

/** Stable machine-readable codes for the system chart of accounts (§61, §62). */
export const SYSTEM_LEDGER_ACCOUNTS = {
  customerDeposits: "CUSTOMER_DEPOSITS",
  settlementClearing: "SETTLEMENT_CLEARING",
  feeRevenue: "FEE_REVENUE",
  adjustmentClearing: "ADJUSTMENT_CLEARING",
} as const;

export type SystemLedgerAccountKey = keyof typeof SYSTEM_LEDGER_ACCOUNTS;

/** Normal balance side derived from the account class (§9). */
export function normalSideFor(accountClass: LedgerAccountClass): LedgerSide {
  return accountClass === "ASSET" || accountClass === "EXPENSE" ? "DEBIT" : "CREDIT";
}

/**
 * Centralised balance formula (§42, §43). Never duplicated in UI code.
 * Amounts in, amount out — both positive minor units.
 */
export function ledgerAccountBalanceMinor(
  accountClass: LedgerAccountClass,
  debitsMinor: number,
  creditsMinor: number,
): number {
  return normalSideFor(accountClass) === "DEBIT"
    ? debitsMinor - creditsMinor
    : creditsMinor - debitsMinor;
}

export type LedgerAccountRef = {
  id: string;
  code: string;
  currency: string;
  accountClass: LedgerAccountClass;
  normalSide: LedgerSide;
  status: LedgerAccountStatus;
};

/** One journal line of a posting request (§24). */
export type PostingEntryInput = {
  ledgerAccountId: string;
  side: LedgerSide;
  amountMinor: number;
  description?: string;
};

/** A complete posting request (§24). Validated server-side and in SQL (§25). */
export type PostingRequest = {
  transactionType: LedgerTransactionType;
  currency: string;
  description: string;
  sourceType: string;
  sourceReference?: string | null;
  /** Deterministic, ownership-scoped key (§36). */
  idempotencyKey: string;
  entries: PostingEntryInput[];
  createdBy?: string | null;
  /** Whitelisted metadata only (§67). */
  metadata?: LedgerMetadata;
};

/** Whitelisted ledger metadata: no secrets, no identity documents (§67). */
export type LedgerMetadata = {
  counterpartyDisplay?: string;
  operationKind?: string;
};

export type PostingResult = {
  transactionId: string;
  reference: string;
  /** True when idempotency resolved to an already-existing posting (§38). */
  alreadyPosted: boolean;
};

/** Structured error categories for observability (§188). */
export type LedgerErrorCode =
  | "posting_validation_failed"
  | "ledger_unbalanced"
  | "currency_mismatch"
  | "duplicate_operation"
  | "insufficient_funds"
  | "projection_failure"
  | "authorization_failed"
  | "ledger_unavailable";

export class LedgerError extends Error {
  readonly code: LedgerErrorCode;

  constructor(code: LedgerErrorCode, message?: string) {
    super(message ?? code);
    this.name = "LedgerError";
    this.code = code;
  }
}

export type HoldStatus = "ACTIVE" | "RELEASED" | "CAPTURED" | "EXPIRED";

export type HoldRequest = {
  accountId: string;
  amountMinor: number;
  reasonType: string;
  sourceReference?: string | null;
  idempotencyKey: string;
  expiresAt?: string | null;
};
