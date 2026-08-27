import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { EmptyState } from "@/components/feedback";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { usePrivacyMode } from "@/components/providers/PrivacyModeProvider";
import { PRIVACY_PLACEHOLDER } from "@/lib/format/mask";
import { formatRelativeDay } from "@/lib/format/date";
import { formatAccountAmount } from "@/features/accounts/utils/account-display";
import type { ActivitySummaryItemDto } from "@/features/accounts/types/account";

/**
 * Recent activity preview (§67 – §73). Read-only, short, and never a
 * substitute for the full transaction history (PROMPT 07).
 */
const STATUS: Record<ActivitySummaryItemDto["status"], { label: string; tone: StatusTone }> = {
  POSTED: { label: "Comptabilisé", tone: "success" },
  PENDING: { label: "En cours", tone: "pending" },
  FAILED: { label: "Échoué", tone: "failed" },
};

export function RecentActivityList({ items }: { items: ActivitySummaryItemDto[] }) {
  const { privacyMode } = usePrivacyMode();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucune opération pour le moment"
        description="Dès qu'une opération sera enregistrée sur votre compte, elle apparaîtra ici."
      />
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((item) => {
        const credit = item.direction === "credit";
        const Icon = credit ? ArrowDownLeft : ArrowUpRight;
        const status = STATUS[item.status];
        return (
          <li key={item.reference} className="flex items-center gap-3 p-4">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken"
              aria-hidden="true"
            >
              <Icon className={credit ? "size-4 text-success" : "size-4 text-danger"} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body truncate text-foreground">{item.displayName}</p>
              <p className="text-caption mt-0.5 text-muted-foreground">
                {formatRelativeDay(item.occurredAt)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-numeric text-body text-foreground">
                {privacyMode
                  ? PRIVACY_PLACEHOLDER
                  : formatAccountAmount(
                      credit ? item.amountMinor : -item.amountMinor,
                      item.currency,
                      item.minorUnit,
                      { signDisplay: "always" },
                    )}
              </p>
              <StatusBadge className="mt-1" label={status.label} tone={status.tone} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
