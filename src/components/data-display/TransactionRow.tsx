import type { ComponentType } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { AmountText } from "./AmountText";
import { formatRelativeDay, toISODate } from "@/lib/format/date";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";

/**
 * One movement in an activity list (PROMPT 01 §18). Presentation only:
 * direction, amount and status are provided by the caller.
 */
export function TransactionRow({
  title,
  subtitle,
  amount,
  currency,
  direction,
  date,
  statusLabel,
  statusTone = "success",
  icon,
  onClick,
  className,
}: {
  title: string;
  subtitle?: string;
  amount: number;
  currency?: string;
  direction: "credit" | "debit";
  date: string | number | Date;
  statusLabel?: string;
  statusTone?: StatusTone;
  icon?: ComponentType<{ className?: string }>;
  onClick?: () => void;
  className?: string;
}) {
  const Icon = icon ?? (direction === "credit" ? ArrowDownLeft : ArrowUpRight);
  const interactive = typeof onClick === "function";
  const Wrapper = interactive ? "button" : "div";

  return (
    <Wrapper
      {...(interactive ? { type: "button" as const, onClick } : {})}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl px-3 py-4 text-left transition-colors",
        interactive &&
          "press-feedback cursor-pointer hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:press-feedback-active active:scale-[0.99]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full transition-transform",
          direction === "credit" ? "bg-success-muted/50 text-success" : "bg-surface-sunken text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="text-label block truncate font-bold text-foreground sm:text-body">{title}</span>
        <span className="text-caption mt-1 flex flex-wrap items-center gap-x-2 text-muted-foreground">
          <time dateTime={toISODate(date)}>{formatRelativeDay(date)}</time>
          {subtitle && <span className="truncate max-w-[120px] sm:max-w-none">· {subtitle}</span>}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <AmountText
          className="text-label sm:text-amount"
          amount={direction === "credit" ? Math.abs(amount) : -Math.abs(amount)}
          direction={direction}
          {...(currency ? { currency } : {})}
        />
        {statusLabel && <StatusBadge label={statusLabel} tone={statusTone} className="h-5 px-2 text-[0.625rem]" />}
      </span>
    </Wrapper>
  );
}
