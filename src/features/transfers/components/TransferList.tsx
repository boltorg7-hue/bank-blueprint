import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight, Landmark } from "lucide-react";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/feedback";
import { useTransfers } from "@/features/transfers/hooks/useTransfers";
import {
  ACTION_REQUIRED_TRANSFER_STATUSES,
  TERMINAL_TRANSFER_STATUSES,
  type TransferDto,
  type TransferListFilter,
} from "@/features/transfers/types/transfer";
import {
  transferKindShortLabel,
  transferStatusLabel,
  transferStatusTone,
} from "@/features/transfers/utils/transfer-display";
import { formatMoneyFromMinor } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ id: TransferListFilter; label: string }> = [
  { id: "ALL", label: "Tous" },
  { id: "ACTION_REQUIRED", label: "Action requise" },
  { id: "PENDING", label: "En cours" },
  { id: "INTERNAL", label: "Notre banque" },
  { id: "EXTERNAL", label: "Autre banque" },
  { id: "COMPLETED", label: "Exécutés" },
  { id: "FAILED", label: "Non aboutis" },
];

function matches(transfer: TransferDto, filter: TransferListFilter): boolean {
  switch (filter) {
    case "INTERNAL":
      return transfer.kind === "INTERNAL_TRANSFER";
    case "EXTERNAL":
      return transfer.kind === "EXTERNAL_TRANSFER";
    case "COMPLETED":
      return transfer.status === "COMPLETED";
    case "FAILED":
      return ["FAILED", "REJECTED", "CANCELLED", "BLOCKED"].includes(transfer.status);
    case "ACTION_REQUIRED":
      return ACTION_REQUIRED_TRANSFER_STATUSES.includes(transfer.status);
    case "PENDING":
      return !TERMINAL_TRANSFER_STATUSES.includes(transfer.status);
    default:
      return true;
  }
}

/** Transfer list, most recent first (§76 – §79 ; PROMPT 08 §77 – §80). */
export function TransferList({ action }: { action?: React.ReactNode }) {
  const { data, isPending, isError, refetch } = useTransfers();
  const [filter, setFilter] = useState<TransferListFilter>("ALL");

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

  const visible = transfers.filter((transfer) => matches(transfer, filter));

  return (
    <div className="space-y-4">
      <div
        role="group"
        aria-label="Filtrer les virements"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {FILTERS.map((item) => {
          const isActive = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilter(item.id)}
              className={cn(
                "text-caption shrink-0 rounded-full border px-3 py-1.5 transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-surface-sunken",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Aucun virement pour ce filtre"
          description="Modifiez le filtre pour retrouver vos autres virements."
        />
      ) : (
        <ul className="space-y-3" role="list">
          {visible.map((transfer) => {
            const isExternal = transfer.kind === "EXTERNAL_TRANSFER";
            const Icon = isExternal ? Landmark : ArrowUpRight;
            return (
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
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {transfer.recipientDisplay}
                      </p>
                      <p className="text-caption truncate text-muted-foreground">
                        {formatDateTime(transfer.createdAt)} ·{" "}
                        {transferKindShortLabel(transfer.kind)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          label={transferStatusLabel(transfer.status)}
                          tone={transferStatusTone(transfer.status)}
                        />
                        {!TERMINAL_TRANSFER_STATUSES.includes(transfer.status) ? (
                          <span className="text-caption text-muted-foreground">
                            {transfer.progressPercent} %
                          </span>
                        ) : null}
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
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
