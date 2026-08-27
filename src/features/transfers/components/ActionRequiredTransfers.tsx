import { Link } from "@tanstack/react-router";
import { ChevronRight, ShieldAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useTransfers } from "@/features/transfers/hooks/useTransfers";
import { ACTION_REQUIRED_TRANSFER_STATUSES } from "@/features/transfers/types/transfer";
import { formatMoneyFromMinor } from "@/lib/format/currency";

/**
 * Dashboard entry point for transfers waiting on the customer (PROMPT 08 §47,
 * §77). Nothing is shown when there is nothing to do: no invented urgency.
 */
export function ActionRequiredTransfers() {
  const { data } = useTransfers(30);
  const pending = (data ?? []).filter((transfer) =>
    ACTION_REQUIRED_TRANSFER_STATUSES.includes(transfer.status),
  );

  if (pending.length === 0) return null;

  return (
    <section aria-labelledby="transfers-action-required" className="space-y-3">
      <h2 id="transfers-action-required" className="text-sm font-semibold text-foreground">
        Action requise
      </h2>
      <ul className="space-y-3" role="list">
        {pending.map((transfer) => (
          <li key={transfer.reference}>
            <Card className="p-0">
              <Link
                to="/app/transfers/$transferRef"
                params={{ transferRef: transfer.reference }}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-sunken"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning"
                >
                  <ShieldAlert className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {transfer.status === "DOCUMENT_REQUIRED"
                      ? "Un justificatif est nécessaire"
                      : "Un virement attend votre confirmation"}
                  </p>
                  <p className="text-caption truncate text-muted-foreground">
                    {transfer.recipientDisplay} ·{" "}
                    {formatMoneyFromMinor(transfer.amountMinor, {
                      currency: transfer.currency,
                      minorUnitScale: 10 ** transfer.minorUnit,
                    })}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
