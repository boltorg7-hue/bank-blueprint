/**
 * CURRENCY & QUOTE UNITS
 *
 * The bank circulates ONE settlement currency: the US dollar (USD). Every
 * ledger entry, balance and statement is expressed in USD minor units.
 *
 * For transfer operations the customer may express the amount either in USD or
 * in USDT (Tether). USDT is a QUOTE UNIT only: it is converted to USD before
 * anything reaches the server, so the accounting stays single-currency and the
 * customer never has to understand the mechanism — the figures update on their
 * own.
 *
 * The conversion below is a presentation conversion, never an accounting
 * computation: the ledger is always credited/debited in USD minor units.
 */

export const SETTLEMENT_CURRENCY = "USD";
export const SETTLEMENT_MINOR_UNIT = 2;

export type QuoteUnit = "USD" | "USDT";

export const QUOTE_UNITS: ReadonlyArray<{
  code: QuoteUnit;
  label: string;
  shortLabel: string;
}> = [
  { code: "USD", label: "Dollar américain (USD)", shortLabel: "USD" },
  { code: "USDT", label: "Tether (USDT)", shortLabel: "USDT" },
];

/**
 * Reference parity applied to customer quotes: 1 USDT = 0.9994 USD.
 * USDT is a dollar-referenced unit, so the parity stays close to par.
 */
export const USD_PER_USDT = 0.9994;

/** Minor-unit precision used when displaying a USDT amount. */
export const USDT_MINOR_UNIT = 2;

/** Rounds to the nearest integer without floating drift on .5 boundaries. */
function roundMinor(value: number): number {
  return Math.round(Number(value.toFixed(4)));
}

/** USDT minor units → USD minor units (the amount actually debited). */
export function usdtMinorToUsdMinor(usdtMinor: number): number {
  return roundMinor(usdtMinor * USD_PER_USDT);
}

/** USD minor units → equivalent USDT minor units (display only). */
export function usdMinorToUsdtMinor(usdMinor: number): number {
  return roundMinor(usdMinor / USD_PER_USDT);
}

/**
 * Converts an amount typed in the selected unit into the settlement amount in
 * USD minor units.
 */
export function quoteToSettlementMinor(amountMinor: number, unit: QuoteUnit): number {
  return unit === "USDT" ? usdtMinorToUsdMinor(amountMinor) : amountMinor;
}

/** Converts a USD settlement amount into the selected display unit. */
export function settlementToQuoteMinor(usdMinor: number, unit: QuoteUnit): number {
  return unit === "USDT" ? usdMinorToUsdtMinor(usdMinor) : usdMinor;
}

/**
 * Formats a USDT amount. Intl has no currency symbol for USDT, so the unit is
 * appended as a suffix, with the same grouping as fiat amounts.
 */
export function formatUsdtFromMinor(usdtMinor: number, locale = "fr-FR"): string {
  const value = usdtMinor / 10 ** USDT_MINOR_UNIT;
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} USDT`;
}

/** Human sentence explaining the applied parity (§ transparency). */
export function usdtParityNotice(): string {
  return `Conversion appliquée : 1 USDT = ${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(USD_PER_USDT)} USD. Votre compte est tenu en dollars américains.`;
}
