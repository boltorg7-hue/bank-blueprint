/**
 * Customer-safe transfer DTOs (PROMPT 07 §64 – §80 ; PROMPT 08 §16, §23 – §27).
 *
 * The transfer is an *intent*; the ledger journal remains the single financial
 * source of truth. Amounts are integer minor units produced by the server, and
 * both the transfer kind and the progress are server-authoritative: the client
 * never sends nor computes them (PROMPT 08 §1, §24, §107).
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
  | "SETTLEMENT_PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REJECTED"
  | "CANCELLED"
  | "BLOCKED"
  | "REVERSED";

/** Server-decided route (§16, §17). Never accepted as client input. */
export type TransferKind = "INTERNAL_TRANSFER" | "EXTERNAL_TRANSFER";

/** Trusted workflow state; the percentage is only its projection (§25, §26). */
export type TransferProgressState =
  | "CREATED"
  | "ACCOUNT_VALIDATED"
  | "FUNDS_VALIDATED"
  | "SECURITY_CONFIRMED"
  | "COMPLIANCE_CHECK"
  | "DOCUMENT_REQUIRED"
  | "DOCUMENT_REVIEW"
  | "FINAL_REVIEW"
  | "APPROVED"
  | "SETTLEMENT_PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "BLOCKED";

/** Customer-facing settlement state; provider vocabulary never leaks (§54). */
export type ExternalSettlementState =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "UNKNOWN";

export type TransferFailureCode =
  | "INSUFFICIENT_FUNDS"
  | "LIMIT_EXCEEDED"
  | "ACCOUNT_RESTRICTED"
  | "DESTINATION_UNAVAILABLE"
  | "DESTINATION_NOT_SUPPORTED"
  | "DESTINATION_IS_INTERNAL"
  | "CURRENCY_MISMATCH"
  | "BENEFICIARY_UNAVAILABLE"
  | "SOURCE_ACCOUNT_UNAVAILABLE"
  | "INVALID_AMOUNT"
  | "INVALID_DESTINATION"
  | "INVALID_TRANSITION"
  | "TRANSFER_UNAVAILABLE"
  | "SETTLEMENT_FAILED"
  | "COMPLIANCE_REJECTED"
  | "PROCESSING_ERROR"
  | "UNEXPECTED_ERROR";

export type TransferRequirementType =
  | "IDENTITY_DOCUMENT"
  | "SOURCE_OF_FUNDS"
  | "INVOICE"
  | "CONTRACT"
  | "PROOF_OF_PAYMENT_PURPOSE"
  | "PROOF_OF_ADDRESS"
  | "OTHER_SUPPORTING_DOCUMENT";

export type TransferRequirementStatus =
  | "REQUIRED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SATISFIED"
  | "REPLACEMENT_REQUIRED"
  | "WAIVED"
  | "EXPIRED";

export type TransferDocumentStatus =
  | "UPLOADED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "REPLACEMENT_REQUIRED";

export type TransferDto = {
  /** Opaque public reference, e.g. TRF-2026-00000042. */
  reference: string;
  status: TransferStatus;
  kind: TransferKind;
  progressState: TransferProgressState;
  /** 0 → 99 → 100, always derived server-side from progressState (§26). */
  progressPercent: number;
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
  /** External destination bank, customer-safe (§64). */
  destinationBankName: string | null;
  destinationCountry: string | null;
  settlementState: ExternalSettlementState | null;
  /** True when the configured rail is a development simulation (§15). */
  settlementIsSimulated: boolean;
  failureCode: TransferFailureCode | null;
  fundsReserved: boolean;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  finalizedAt: string | null;
  /** Ledger journal reference once the movement is posted. */
  transactionReference: string | null;
};

export type TransferStatusEventDto = {
  status: TransferStatus;
  reasonCode: string | null;
  occurredAt: string;
};

export type TransferRequirementDto = {
  id: string;
  requirementType: TransferRequirementType;
  title: string;
  description: string | null;
  status: TransferRequirementStatus;
  isMandatory: boolean;
  /** Customer-safe rejection reason only (§37). */
  rejectionReasonCode: string | null;
  requestedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
};

export type TransferDocumentDto = {
  id: string;
  requirementId: string | null;
  documentType: TransferRequirementType;
  originalFilename: string | null;
  status: TransferDocumentStatus;
  rejectionReasonCode: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
};

export type TransferDetailDto = TransferDto & {
  timeline: TransferStatusEventDto[];
  requirements: TransferRequirementDto[];
  documents: TransferDocumentDto[];
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
  kind: TransferKind;
  progressPercent: number;
  failureCode: TransferFailureCode | null;
  transactionReference: string | null;
};

export const TRANSFER_REFERENCE_PATTERN = /^TRF-\d{4}-\d{8}$/;

/** Terminal states: no further customer action is possible. */
export const TERMINAL_TRANSFER_STATUSES: readonly TransferStatus[] = [
  "COMPLETED",
  "FAILED",
  "REJECTED",
  "CANCELLED",
  "BLOCKED",
  "REVERSED",
];

/** States where the customer must act before the transfer can progress (§47). */
export const ACTION_REQUIRED_TRANSFER_STATUSES: readonly TransferStatus[] = [
  "READY_FOR_CONFIRMATION",
  "DOCUMENT_REQUIRED",
];

export type TransferListFilter =
  | "ALL"
  | "INTERNAL"
  | "EXTERNAL"
  | "COMPLETED"
  | "PENDING"
  | "ACTION_REQUIRED"
  | "FAILED";
