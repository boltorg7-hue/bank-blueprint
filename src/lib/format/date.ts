import { BRAND } from "@/config/brand";

/** Consistent date/time display across every banking surface. */

type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

/** "25 août 2026" */
export function formatDate(input: DateInput, locale: string = BRAND.locale.tag): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(toDate(input));
}

/** "25 août 2026, 14:35" — transaction details. */
export function formatDateTime(input: DateInput, locale: string = BRAND.locale.tag): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(input));
}

/** "14:35" */
export function formatTime(input: DateInput, locale: string = BRAND.locale.tag): string {
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(
    toDate(input),
  );
}

/**
 * "Aujourd'hui, 14:35" / "Hier, 09:12" / "25 août 2026" — activity lists.
 * `now` is injectable so components stay deterministic and testable.
 */
export function formatRelativeDay(
  input: DateInput,
  options: { locale?: string; now?: Date } = {},
): string {
  const { locale = BRAND.locale.tag, now = new Date() } = options;
  const date = toDate(input);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOf(now) - startOf(date)) / 86_400_000);

  if (dayDiff === 0) return `Aujourd'hui, ${formatTime(date, locale)}`;
  if (dayDiff === 1) return `Hier, ${formatTime(date, locale)}`;
  if (dayDiff > 1 && dayDiff < 7) {
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
    return `${weekday}, ${formatTime(date, locale)}`;
  }
  return formatDate(date, locale);
}

/** Machine-readable value for <time dateTime="…">. */
export function toISODate(input: DateInput): string {
  return toDate(input).toISOString();
}
