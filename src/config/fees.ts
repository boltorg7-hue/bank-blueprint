/**
 * CENTRAL FEE SCHEDULE (PROMPT 02 §30 – §32, PROMPT 07 pricing disclosure).
 *
 * Single source of truth for every customer-facing fee. The UI never computes
 * a fee: it reads this schedule and renders it. Amounts are expressed in MINOR
 * units per currency (cents), exactly like the ledger.
 *
 * `null` means "not yet contracted": the UI must render it as "À définir" and
 * MUST NOT fabricate a value. A `0` means the operation is explicitly free.
 *
 * No fee is posted to the ledger today: transfers are debited for their exact
 * amount. When commercial fees are contracted, add the amount here AND the
 * corresponding ledger posting server-side — never one without the other.
 */

/** Currencies the fee grid can quote. */
export const FEE_CURRENCIES = ["TTD", "USD", "EUR"] as const;
export type FeeCurrency = (typeof FEE_CURRENCIES)[number];

/** Minor amount per currency; null = not contracted yet. */
export type FeeAmountByCurrency = Partial<Record<FeeCurrency, number | null>>;

export type FeeCode =
  | "ACCOUNT_OPENING"
  | "ACCOUNT_MAINTENANCE_MONTHLY"
  | "ACCOUNT_CLOSING"
  | "TRANSFER_INTERNAL"
  | "TRANSFER_EXTERNAL"
  | "TRANSFER_COMPLIANCE_REVIEW"
  | "STATEMENT_DIGITAL"
  | "STATEMENT_DUPLICATE";

export type FeeDefinition = {
  code: FeeCode;
  label: string;
  note?: string;
  amounts: FeeAmountByCurrency;
};

/** Minor-unit scale used by the quoted currencies (2 decimals). */
export const FEE_MINOR_UNIT = 2;

export const FEE_SCHEDULE: Record<FeeCode, FeeDefinition> = {
  ACCOUNT_OPENING: {
    code: "ACCOUNT_OPENING",
    label: "Ouverture de compte",
    amounts: { TTD: 0, USD: 0, EUR: 0 },
  },
  ACCOUNT_MAINTENANCE_MONTHLY: {
    code: "ACCOUNT_MAINTENANCE_MONTHLY",
    label: "Tenue de compte mensuelle",
    note: "Prélevée le premier jour ouvré du mois lorsqu'elle sera contractée.",
    amounts: { TTD: null, USD: null, EUR: null },
  },
  ACCOUNT_CLOSING: {
    code: "ACCOUNT_CLOSING",
    label: "Clôture de compte",
    amounts: { TTD: 0, USD: 0, EUR: 0 },
  },
  TRANSFER_INTERNAL: {
    code: "TRANSFER_INTERNAL",
    label: "Virement interne entre comptes RFC",
    note: "Exécution immédiate entre comptes tenus par la banque.",
    amounts: { TTD: 0, USD: 0, EUR: 0 },
  },
  TRANSFER_EXTERNAL: {
    code: "TRANSFER_EXTERNAL",
    label: "Virement vers une autre banque",
    note: "Frais de règlement interbancaire, débités avec le virement.",
    amounts: { TTD: null, USD: null, EUR: null },
  },
  TRANSFER_COMPLIANCE_REVIEW: {
    code: "TRANSFER_COMPLIANCE_REVIEW",
    label: "Virement nécessitant une vérification complémentaire",
    note: "Les contrôles de conformité ne sont jamais facturés.",
    amounts: { TTD: 0, USD: 0, EUR: 0 },
  },
  STATEMENT_DIGITAL: {
    code: "STATEMENT_DIGITAL",
    label: "Relevé numérique (PDF)",
    amounts: { TTD: 0, USD: 0, EUR: 0 },
  },
  STATEMENT_DUPLICATE: {
    code: "STATEMENT_DUPLICATE",
    label: "Duplicata de relevé",
    amounts: { TTD: 0, USD: 0, EUR: 0 },
  },
};

/** Narrow an arbitrary account currency to a quoted fee currency. */
export function toFeeCurrency(currency: string): FeeCurrency | null {
  const upper = currency.toUpperCase() as FeeCurrency;
  return (FEE_CURRENCIES as readonly string[]).includes(upper) ? upper : null;
}

/**
 * Fee minor amount for an operation in a given currency.
 * Returns `null` when no amount is contracted (or currency not quoted).
 */
export function feeMinorFor(code: FeeCode, currency: string): number | null {
  const feeCurrency = toFeeCurrency(currency);
  if (!feeCurrency) return null;
  return FEE_SCHEDULE[code].amounts[feeCurrency] ?? null;
}

/** Fee code applicable to a transfer, based on the bank-side routing decision. */
export function transferFeeCode(kind: "INTERNAL_TRANSFER" | "EXTERNAL_TRANSFER"): FeeCode {
  return kind === "EXTERNAL_TRANSFER" ? "TRANSFER_EXTERNAL" : "TRANSFER_INTERNAL";
}
