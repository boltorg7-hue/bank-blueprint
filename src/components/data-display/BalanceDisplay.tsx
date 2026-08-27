import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format/currency";
import { PRIVACY_PLACEHOLDER } from "@/lib/format/mask";
import { usePrivacyMode } from "@/components/providers/PrivacyModeProvider";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders a balance already computed by the server (PROMPT 01 §16).
 * This component NEVER computes or mutates a balance.
 */
export function BalanceDisplay({
  amount,
  currency,
  label,
  hint,
  size = "lg",
  loading = false,
  className,
}: {
  amount: number | null | undefined;
  currency?: string;
  label?: string;
  hint?: string;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  className?: string;
}) {
  const { privacyMode } = usePrivacyMode();

  const sizeClass =
    size === "lg" ? "text-balance-value" : size === "md" ? "text-amount" : "text-numeric text-body";

  return (
    <div className={cn("min-w-0", className)}>
      {label && <p className="text-overline text-muted-foreground">{label}</p>}
      {loading ? (
        <Skeleton className="mt-2 h-9 w-40" />
      ) : (
        <p className={cn("mt-1 text-foreground", sizeClass)}>
          {privacyMode
            ? PRIVACY_PLACEHOLDER
            : amount == null
              ? "—"
              : formatMoney(amount, currency ? { currency } : {})}
        </p>
      )}
      {hint && <p className="text-caption mt-1 text-muted-foreground">{hint}</p>}
    </div>
  );
}
