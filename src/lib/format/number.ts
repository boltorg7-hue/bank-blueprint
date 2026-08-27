import { BRAND } from "@/config/brand";

/** Presentation-only numeric formatting helpers. */

export function formatNumber(
  value: number,
  options: { locale?: string; maximumFractionDigits?: number } = {},
): string {
  const { locale = BRAND.locale.tag, maximumFractionDigits = 2 } = options;
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

/** 12345 → "12,3 k" — used only for non-financial summaries. */
export function formatCompactNumber(value: number, locale: string = BRAND.locale.tag): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

/** 0.0432 → "+4,3 %". Ratio in, percentage out. */
export function formatPercent(
  ratio: number,
  options: { locale?: string; maximumFractionDigits?: number; signDisplay?: "auto" | "always" } = {},
): string {
  const { locale = BRAND.locale.tag, maximumFractionDigits = 1, signDisplay = "auto" } = options;
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits,
    signDisplay,
  }).format(ratio);
}

/** Clamps a progress value into the 0–100 range expected by <Progress />. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
