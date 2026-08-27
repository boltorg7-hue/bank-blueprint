/**
 * Sensitive-identifier masking (PROMPT 01 §29 / §74).
 * Never render a full account identifier by default.
 */

/** "FR7630006000011234567890189" → "•••• •••• 0189" */
export function maskIdentifier(value: string, visibleDigits = 4): string {
  const compact = value.replace(/\s/g, "");
  const tail = compact.slice(-visibleDigits);
  return `•••• •••• ${tail}`;
}

/** Groups an identifier in blocks of four for readable display. */
export function groupIdentifier(value: string, groupSize = 4): string {
  const compact = value.replace(/\s/g, "");
  return compact.replace(new RegExp(`(.{${groupSize}})`, "g"), "$1 ").trim();
}

/** Placeholder used by privacy mode instead of a monetary value. */
export const PRIVACY_PLACEHOLDER = "••••••";
