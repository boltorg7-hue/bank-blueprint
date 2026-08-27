import type { ComponentType, ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Compact metric card for dashboards (customer summaries, admin KPIs).
 * Presentation only — values and trends come from the caller.
 */
export function KpiCard({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  loading = false,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: { direction: "up" | "down"; label: string; tone?: "positive" | "negative" | "neutral" };
  icon?: ComponentType<{ className?: string }>;
  loading?: boolean;
  className?: string;
}) {
  const TrendIcon = trend?.direction === "down" ? TrendingDown : TrendingUp;
  const trendTone =
    trend?.tone === "negative"
      ? "text-danger"
      : trend?.tone === "neutral"
        ? "text-muted-foreground"
        : "text-success";

  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-overline text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-24" />
      ) : (
        <p className="text-amount mt-2 text-foreground">{value}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-2">
        {trend && (
          <span className={cn("text-caption inline-flex items-center gap-1 font-semibold", trendTone)}>
            <TrendIcon className="size-3.5" aria-hidden="true" />
            {trend.label}
          </span>
        )}
        {hint && <span className="text-caption text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
