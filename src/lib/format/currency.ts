import { BRAND } from "@/config/brand";

/**
 * Presentation-only currency formatting.
 *
 * IMPORTANT: monetary arithmetic is never performed here. Amounts are produced
 * by the server ledger (PROMPT 06) in minor units; this module only renders
 * them. Never use these helpers to compute totals.
 */

export type MoneyFormatOptions = {
  locale?: string;
  currency?: string;
  /** Hide the currency symbol (useful when the label already states it). */
  hideSymbol?: boolean;
  /** Force a leading + on positive values (transaction credits). */
  signDisplay?: "auto" | "always" | "never" | "exceptZero";
  /** Round to whole units (compact dashboards). */
  maximumFractionDigits?: number;
};

/** Formats a decimal-unit amount (e.g. 1234.5 → "1 234,50 €"). */
export function formatMoney(amount: number, options: MoneyFormatOptions = {}): string {
  const {
    locale = BRAND.locale.tag,
    currency = BRAND.locale.currency,
    hideSymbol = false,
    signDisplay = "auto",
    maximumFractionDigits = 2,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: hideSymbol ? "decimal" : "currency",
    currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
    maximumFractionDigits,
    signDisplay,
  }).format(amount);
}

/**
 * Formats an amount stored in minor units (cents) — the ledger's storage shape.
 * The division is a pure display conversion, not a financial computation.
 */
export function formatMoneyFromMinor(
  minorUnits: number,
  options: MoneyFormatOptions & { minorUnitScale?: number } = {},
): string {
  const { minorUnitScale = 100, ...rest } = options;
  return formatMoney(minorUnits / minorUnitScale, rest);
}

/** Currency symbol alone, for input adornments. */
export function currencySymbol(
  currency: string = BRAND.locale.currency,
  locale: string = BRAND.locale.tag,
): string {
  const parts = new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

/**
 * Parses a user-typed amount into a decimal number, or null when invalid.
 * Accepts both comma and dot decimal separators plus grouping spaces.
 */
export function parseAmountInput(raw: string): number | null {
  const normalized = raw
    .replace(/\s|\u00a0|\u202f/g, "")
    .replace(/[^\d,.-]/g, "")
    .replace(/,/g, ".");
  if (normalized === "" || normalized === "-" || normalized === ".") return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
