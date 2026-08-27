/**
 * Customer-safe beneficiary DTOs (PROMPT 07 §11 – §22).
 *
 * A beneficiary never exposes the destination account id, the recipient's full
 * legal identity, nor any internal database key. The confirmation payload is
 * deliberately minimal: a safe display name and the last digits of the account.
 */

export type BeneficiaryStatus = "ACTIVE" | "DISABLED" | "REMOVED" | "PENDING_VERIFICATION";

export type BeneficiaryDto = {
  /** Opaque public reference, e.g. BEN-2026-000012. */
  reference: string;
  /** Safe display name derived server-side (first name + last initial). */
  displayName: string;
  /** Customer-chosen label, shown in priority when present. */
  nickname: string | null;
  /** Trailing digits only. */
  maskedNumber: string;
  currency: string;
  status: BeneficiaryStatus;
  lastUsedAt: string | null;
  createdAt: string;
};

/** Minimal resolution payload shown before a beneficiary is saved (§12, §14). */
export type ResolvedDestinationDto = {
  displayName: string;
  maskedNumber: string;
  currency: string;
  isOwnAccount: boolean;
};

export const BENEFICIARY_REFERENCE_PATTERN = /^BEN-\d{4}-\d{6}$/;
