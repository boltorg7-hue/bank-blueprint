/**
 * Customer-safe beneficiary DTOs (PROMPT 07 §11 – §22 ; PROMPT 08 §61 – §64).
 *
 * A beneficiary never exposes the destination account id, the recipient's full
 * legal identity, nor any internal database key. The confirmation payload is
 * deliberately minimal: a safe display name and the last digits of the account.
 * External destinations add the bank name and country, still masked.
 */

export type BeneficiaryStatus = "ACTIVE" | "DISABLED" | "REMOVED" | "PENDING_VERIFICATION";

/** Where the destination lives. Decided server-side, never by the client (§17). */
export type BeneficiaryKind = "INTERNAL" | "EXTERNAL";

export type BeneficiaryDto = {
  /** Opaque public reference, e.g. BEN-2026-000012. */
  reference: string;
  kind: BeneficiaryKind;
  /** Safe display name derived server-side (first name + last initial). */
  displayName: string;
  /** Customer-chosen label, shown in priority when present. */
  nickname: string | null;
  /** Trailing digits only. */
  maskedNumber: string;
  currency: string;
  status: BeneficiaryStatus;
  /** External destinations only. */
  bankName: string | null;
  country: string | null;
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

/** Supported external destinations, exposed without provider details (§54). */
export type SettlementRailDto = {
  code: string;
  displayName: string;
  country: string;
  currency: string;
  /** True while the rail performs no real settlement (§15). */
  isSimulated: boolean;
};

export const BENEFICIARY_REFERENCE_PATTERN = /^BEN-\d{4}-\d{6}$/;
