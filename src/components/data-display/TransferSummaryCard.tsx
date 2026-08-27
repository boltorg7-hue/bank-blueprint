import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { AmountText } from "./AmountText";
import { maskIdentifier } from "@/lib/format/mask";

/**
 * Recap block shown before confirming a transfer (PROMPT 01 §19).
 * Presentation only — no validation, no fee computation.
 */
export function TransferSummaryCard({
  amount,
  currency,
  fromLabel,
  fromIdentifier,
  toLabel,
  toIdentifier,
  reference,
  rows,
  className,
}: {
  amount: number;
  currency?: string;
  fromLabel: string;
  fromIdentifier?: string;
  toLabel: string;
  toIdentifier?: string;
  reference?: string;
  /** Extra server-provided lines (fees, execution date…). */
  rows?: Array<{ label: string; value: string }>;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-4", className)}>
      <p className="text-overline text-muted-foreground">Montant</p>
      <div className="mt-1">
        <AmountText
          amount={Math.abs(amount)}
          direction="neutral"
          className="text-balance-value"
          {...(currency ? { currency } : {})}
        />
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-lg bg-surface-sunken p-3">
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">Depuis</p>
          <p className="text-label truncate text-foreground">{fromLabel}</p>
          {fromIdentifier && (
            <p className="text-numeric text-caption text-muted-foreground">
              {maskIdentifier(fromIdentifier)}
            </p>
          )}
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">Vers</p>
          <p className="text-label truncate text-foreground">{toLabel}</p>
          {toIdentifier && (
            <p className="text-numeric text-caption text-muted-foreground">
              {maskIdentifier(toIdentifier)}
            </p>
          )}
        </div>
      </div>

      {(reference || rows?.length) && (
        <dl className="mt-4 space-y-2">
          {reference && (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-caption text-muted-foreground">Référence</dt>
              <dd className="text-body-sm text-right text-foreground">{reference}</dd>
            </div>
          )}
          {rows?.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <dt className="text-caption text-muted-foreground">{row.label}</dt>
              <dd className="text-body-sm text-right text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
