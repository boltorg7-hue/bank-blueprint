import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/feedback";
import { useTransfers } from "@/features/transfers/hooks/useTransfers";
import {
  transferStatusLabel,
  transferStatusTone,
} from "@/features/transfers/utils/transfer-display";
import { formatMoneyFromMinor } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";

/** Transfer list, most recent first (§76 – §79). */
export function TransferList({ action }: { action?: React.ReactNode }) {
  const { data, isPending, isError, refetch } = useTransfers();

  if (isPending) return <SkeletonBlock lines={4} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const transfers = data ?? [];

  if (transfers.length === 0) {
    return (
      <EmptyState
        title="Aucun virement"
        description="Vos virements apparaîtront ici dès votre première opération."
        action={action}
      />
    );
  }

  return (
    <ul className="space-y-3" role="list">
      {transfers.map((transfer) => (
        <li key={transfer.reference}>
          <Card className="p-0">
            <Link
              to="/app/transfers/$transferRef"
              params={{ transferRef: transfer.reference }}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-sunken"
            >
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-muted-foreground"
              >
                <ArrowUpRight className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {transfer.recipientDisplay}
                </p>
                <p className="text-caption truncate text-muted-foreground">
                  {formatDateTime(transfer.createdAt)} · {transfer.reference}
                </p>
                <div className="mt-1">
                  <StatusBadge
                    label={transferStatusLabel(transfer.status)}
                    tone={transferStatusTone(transfer.status)}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-amount text-sm font-semibold text-foreground">
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
  );
}
