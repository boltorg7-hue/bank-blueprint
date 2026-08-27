/**
 * Customer-safe transfer DTOs (PROMPT 07 §64 – §80, §150).
 *
 * The transfer is an *intent*; the ledger journal remains the single financial
 * source of truth. Amounts are integer minor units produced by the server.
 */

export type TransferStatus =
  | "DRAFT"
  | "READY_FOR_CONFIRMATION"
  | "CONFIRMED"
  | "FUNDS_RESERVED"
  | "PROCESSING"
  | "COMPLIANCE_REVIEW"
  | "DOCUMENT_REQUIRED"
  | "APPROVED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "BLOCKED"
  | "REVERSED";

export type TransferFailureCode =
  | "INSUFFICIENT_FUNDS"
  | "LIMIT_EXCEEDED"
  | "ACCOUNT_RESTRICTED"
  | "DESTINATION_UNAVAILABLE"
  | "CURRENCY_MISMATCH"
  | "BENEFICIARY_UNAVAILABLE"
  | "SOURCE_ACCOUNT_UNAVAILABLE"
  | "INVALID_AMOUNT"
  | "INVALID_TRANSITION"
  | "TRANSFER_UNAVAILABLE"
  | "PROCESSING_ERROR"
  | "UNEXPECTED_ERROR";

export type TransferDto = {
  /** Opaque public reference, e.g. TRF-2026-00000042. */
  reference: string;
  status: TransferStatus;
  amountMinor: number;
  currency: string;
  minorUnit: number;
  customerReference: string | null;
  /** Snapshot: survives the removal of the beneficiary (§152). */
  recipientDisplay: string;
  destinationMasked: string;
  sourceMasked: string;
  sourceAccountReference: string | null;
  beneficiaryReference: string | null;
  failureCode: TransferFailureCode | null;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  /** Ledger journal reference once the movement is posted. */
  transactionReference: string | null;
};

export type TransferStatusEventDto = {
  status: TransferStatus;
  reasonCode: string | null;
  occurredAt: string;
};

export type TransferDetailDto = TransferDto & {
  timeline: TransferStatusEventDto[];
};

export type TransferLimitsDto = {
  currency: string;
  maxPerTransferMinor: number;
  dailyLimitMinor: number;
  monthlyLimitMinor: number;
};

export type TransferConfirmationResultDto = {
  reference: string;
  status: TransferStatus;
  failureCode: TransferFailureCode | null;
  transactionReference: string | null;
};

export const TRANSFER_REFERENCE_PATTERN = /^TRF-\d{4}-\d{8}$/;

/** Terminal states: no further customer action is possible. */
export const TERMINAL_TRANSFER_STATUSES: readonly TransferStatus[] = [
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "BLOCKED",
  "REVERSED",
];
