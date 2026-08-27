/**
 * Customer-safe account DTOs (PROMPT 05 §78, §124).
 *
 * These are the ONLY account shapes that cross the server boundary. Internal
 * database ids, compliance fields and admin notes never appear here.
 *
 * All monetary values are authoritative integer MINOR units produced by the
 * server balance projection. The client formats them; it never computes them.
 */

export type AccountStatus =
  | "PENDING"
  | "ACTIVE"
  | "RESTRICTED"
  | "SUSPENDED"
  | "FROZEN"
  | "CLOSING"
  | "CLOSED";

export type AccountType = "CURRENT" | "SAVINGS";

/** Server-managed balance read model. Never mutated from customer code. */
export type AccountBalanceProjection = {
  currency: string;
  /** Number of decimals for this currency (0 for zero-decimal currencies). */
  minorUnit: number;
  ledgerBalanceMinor: number;
  availableBalanceMinor: number;
  heldBalanceMinor: number;
  version: number;
  calculatedAt: string;
};

export type CustomerAccountSummaryDto = {
  /** Opaque public reference used in routes (e.g. ACC-2026-000481). */
  reference: string;
  displayName: string;
  accountType: AccountType;
  currency: string;
  minorUnit: number;
  status: AccountStatus;
  isPrimary: boolean;
  /** Trailing digits only. */
  maskedNumber: string;
  openedAt: string | null;
  /**
   * Null means "balance unavailable" — it must never be rendered as 0.00
   * (§53, §156).
   */
  balance: AccountBalanceProjection | null;
};

/** Banking coordinates, jurisdiction-flexible (§7, §46). */
export type AccountCoordinates = {
  accountNumber: string;
  bankCode: string | null;
  branchCode: string | null;
  bic: string | null;
  /** Null in jurisdictions without IBAN — IBAN is never assumed (§7). */
  iban: string | null;
};

export type CustomerAccountDetailsDto = CustomerAccountSummaryDto & {
  holderName: string;
  coordinates: AccountCoordinates;
  closedAt: string | null;
};

/**
 * Activity contract. The authoritative transaction entity arrives with the
 * double-entry ledger (PROMPT 06); this shape is the read contract only.
 */
export type ActivitySummaryItemDto = {
  reference: string;
  type: string;
  direction: "credit" | "debit";
  displayName: string;
  amountMinor: number;
  currency: string;
  minorUnit: number;
  occurredAt: string;
  status: "POSTED" | "PENDING" | "FAILED";
};

/** Monthly aggregate contract, computed server-side only (§61). */
export type MonthlySummaryDto = {
  periodStart: string;
  periodEnd: string;
  currency: string;
  minorUnit: number;
  moneyInMinor: number;
  moneyOutMinor: number;
  netMinor: number;
  /** False while the ledger engine is not in service: values are structural. */
  ledgerAvailable: boolean;
};

export type DashboardSummaryDto = {
  accounts: CustomerAccountSummaryDto[];
  /** Reference of the account the server considers primary, if any. */
  primaryAccountReference: string | null;
  recentActivity: ActivitySummaryItemDto[];
  monthlySummary: MonthlySummaryDto | null;
  /** True when provisioning is still in progress for an active customer. */
  provisioningPending: boolean;
};
