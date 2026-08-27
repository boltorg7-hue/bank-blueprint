import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { BalanceDisplay } from "./BalanceDisplay";
import { maskIdentifier } from "@/lib/format/mask";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";

/**
 * Visual account card (PROMPT 01 §17) — presentation only.
 * Balances are supplied by the caller from a server projection.
 */
export function AccountCard({
  name,
  identifier,
  balance,
  currency,
  statusLabel,
  statusTone = "success",
  meta,
  onClick,
  className,
}: {
  name: string;
  identifier: string;
  balance: number | null | undefined;
  currency?: string;
  statusLabel?: string;
  statusTone?: StatusTone;
  meta?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const interactive = typeof onClick === "function";
  const Wrapper = interactive ? "button" : "div";

  return (
    <Wrapper
      {...(interactive ? { type: "button" as const, onClick } : {})}
      className={cn(
        "block w-full rounded-xl border border-border bg-surface p-4 text-left shadow-[var(--shadow-card)]",
        interactive &&
          "press-feedback cursor-pointer hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.995]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-heading-sm truncate text-foreground">{name}</p>
          <p className="text-numeric text-caption mt-0.5 text-muted-foreground">
            {maskIdentifier(identifier)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {statusLabel && <StatusBadge label={statusLabel} tone={statusTone} />}
          {interactive && <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />}
        </div>
      </div>
      <BalanceDisplay
        className="mt-4"
        label="Solde disponible"
        amount={balance}
        {...(currency ? { currency } : {})}
      />
      {meta && <div className="text-caption mt-3 text-muted-foreground">{meta}</div>}
    </Wrapper>
  );
}
