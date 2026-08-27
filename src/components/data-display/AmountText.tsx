import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format/currency";
import { PRIVACY_PLACEHOLDER } from "@/lib/format/mask";
import { usePrivacyMode } from "@/components/providers/PrivacyModeProvider";

/**
 * A single monetary value in a list or table. Credits and debits are
 * distinguished by sign AND colour — never colour alone.
 */
export function AmountText({
  amount,
  currency,
  direction,
  className,
}: {
  amount: number;
  currency?: string;
  /** "credit" = money in, "debit" = money out, "neutral" = informational. */
  direction?: "credit" | "debit" | "neutral";
  className?: string;
}) {
  const { privacyMode } = usePrivacyMode();
  const tone =
    direction === "credit" ? "text-success" : direction === "debit" ? "text-foreground" : "text-foreground";

  return (
    <span className={cn("text-amount tabular-nums", tone, className)}>
      {privacyMode
        ? PRIVACY_PLACEHOLDER
        : formatMoney(amount, {
            signDisplay: direction === "neutral" ? "auto" : "exceptZero",
            ...(currency ? { currency } : {}),
          })}
    </span>
  );
}
