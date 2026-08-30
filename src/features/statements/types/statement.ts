/**
 * Customer-safe statement DTOs (PROMPT 09 §18 – §27).
 *
 * A statement is an immutable financial document: every figure below is
 * produced server-side from the ledger-backed snapshot taken at issuance
 * (§7, §22). The client never computes an opening balance, a closing balance
 * nor a running balance (§9, §10, §25).
 */

export type DocumentLifecycleStatus = "GENERATING" | "READY" | "FAILED" | "SUPERSEDED";

export type StatementPeriodKind = "MONTHLY" | "CUSTOM";

export type StatementLineDirection = "CREDIT" | "DEBIT";

/** One official statement line, taken from the snapshot (§24, §25). */
export type StatementLineDto = {
  reference: string;
  occurredAt: string;
  description: string;
  direction: StatementLineDirection;
  amountMinor: number;
  /** Running balance computed server-side at issuance. */
  balanceMinor: number;
};

export type StatementDto = {
  /** Opaque public reference, e.g. STM-2026-00004821. */
  reference: string;
  accountReference: string;
  accountDisplayName: string;
  periodKind: StatementPeriodKind;
  periodStart: string;
  periodEnd: string;
  currency: string;
  minorUnit: number;
  openingBalanceMinor: number;
  closingBalanceMinor: number;
  totalCreditMinor: number;
  totalDebitMinor: number;
  transactionCount: number;
  status: DocumentLifecycleStatus;
  version: number;
  generatedAt: string | null;
  /** Reference of the generated PDF in the document centre, once READY. */
  documentReference: string | null;
  failureCode: string | null;
  createdAt: string;
};

export type StatementDetailDto = StatementDto & {
  /** Legal account-holder identity at issuance (§23, §87). */
  holderName: string;
  accountMaskedNumber: string;
  iban: string | null;
  bic: string | null;
  lines: StatementLineDto[];
};

export type StatementGenerationRequest = {
  accountReference: string;
  periodStart: string;
  periodEnd: string;
  periodKind: StatementPeriodKind;
};

export const STATEMENT_REFERENCE_PATTERN = /^STM-\d{4}-\d{8}$/;

/** Customer-facing failure codes surfaced by the generation pipeline (§49). */
export type StatementFailureCode =
  | "ACCOUNT_UNAVAILABLE"
  | "INVALID_PERIOD"
  | "PERIOD_IN_FUTURE"
  | "PERIOD_TOO_LONG"
  | "PERIOD_BEFORE_ACCOUNT_OPENING"
  | "STATEMENT_RECONCILIATION_FAILED"
  | "STATEMENT_UNAVAILABLE"
  | "GENERATION_FAILED"
  | "UNEXPECTED_ERROR";

export const STATEMENT_ERROR_MESSAGES: Record<StatementFailureCode, string> = {
  ACCOUNT_UNAVAILABLE: "Ce compte n'est pas disponible pour l'édition d'un relevé.",
  INVALID_PERIOD: "La période sélectionnée n'est pas valide.",
  PERIOD_IN_FUTURE: "Un relevé officiel ne peut pas couvrir une période future.",
  PERIOD_TOO_LONG: "La période demandée est trop longue : choisissez un relevé mensuel.",
  PERIOD_BEFORE_ACCOUNT_OPENING:
    "Le compte n'existait pas encore sur la période sélectionnée.",
  STATEMENT_RECONCILIATION_FAILED:
    "Les montants n'ont pas pu être réconciliés : aucun relevé officiel n'a été émis.",
  STATEMENT_UNAVAILABLE: "Ce relevé n'est pas disponible.",
  GENERATION_FAILED: "Nous n'avons pas pu générer ce relevé. Réessayez.",
  UNEXPECTED_ERROR: "Nous n'avons pas pu générer ce relevé. Réessayez.",
};

export function statementErrorMessage(code: string | null | undefined): string {
  const key = (code ?? "UNEXPECTED_ERROR") as StatementFailureCode;
  return STATEMENT_ERROR_MESSAGES[key] ?? STATEMENT_ERROR_MESSAGES.UNEXPECTED_ERROR;
}
