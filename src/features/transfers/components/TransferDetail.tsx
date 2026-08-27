import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/feedback";
import {
  useCancelTransfer,
  useConfirmTransfer,
  useTransferDetail,
} from "@/features/transfers/hooks/useTransfers";
import { TERMINAL_TRANSFER_STATUSES } from "@/features/transfers/types/transfer";
import {
  transferErrorMessage,
  transferFailureMessage,
  transferStatusLabel,
  transferStatusTone,
} from "@/features/transfers/utils/transfer-display";
import { formatMoneyFromMinor } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";

/** Transfer receipt and timeline (§150 – §157). */
export function TransferDetail({ reference }: { reference: string }) {
  const { data, isPending, isError, refetch } = useTransferDetail(reference);
  const confirm = useConfirmTransfer();
  const cancel = useCancelTransfer();

  if (isPending) return <SkeletonBlock lines={5} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) {
    return (
      <EmptyState
        title="Virement introuvable"
        description="Ce virement n'existe pas ou n'est pas rattaché à votre espace."
      />
    );
  }

  const pendingAction = !TERMINAL_TRANSFER_STATUSES.includes(data.status);
  const failureMessage = transferFailureMessage(data.failureCode);

  const rows: Array<{ label: string; value: string }> = [
    { label: "Bénéficiaire", value: data.recipientDisplay },
    { label: "Compte destinataire", value: `•••• ${data.destinationMasked}` },
    { label: "Compte débité", value: `•••• ${data.sourceMasked}` },
    { label: "Créé le", value: formatDateTime(data.createdAt) },
  ];
  if (data.completedAt) rows.push({ label: "Exécuté le", value: formatDateTime(data.completedAt) });
  if (data.customerReference) rows.push({ label: "Référence", value: data.customerReference });
  rows.push({ label: "Référence du virement", value: data.reference });

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-amount text-2xl font-semibold text-foreground">
            {formatMoneyFromMinor(data.amountMinor, {
              currency: data.currency,
              minorUnitScale: 10 ** data.minorUnit,
            })}
          </p>
          <StatusBadge
            label={transferStatusLabel(data.status)}
            tone={transferStatusTone(data.status)}
          />
          {failureMessage ? (
            <p role="alert" className="text-caption max-w-prose text-danger">
              {failureMessage}
            </p>
          ) : null}
        </div>

        <dl className="divide-y divide-border rounded-lg border border-border">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3 px-4 py-3">
              <dt className="text-caption text-muted-foreground">{row.label}</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>

        {data.transactionReference ? (
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link
              to="/app/transactions/$transactionRef"
              params={{ transactionRef: data.transactionReference }}
            >
              Voir l'opération comptable
            </Link>
          </Button>
        ) : null}

        {pendingAction ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={cancel.isPending || confirm.isPending}
              onClick={() =>
                cancel.mutate(data.reference, {
                  onSuccess: () => toast.success("Virement annulé"),
                  onError: (error) => toast.error(transferErrorMessage(error)),
                })
              }
            >
              Annuler le virement
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={confirm.isPending || cancel.isPending}
              onClick={() =>
                confirm.mutate(data.reference, {
                  onSuccess: (outcome) => {
                    if (outcome.status === "COMPLETED") toast.success("Virement exécuté");
                    else toast.error(transferFailureMessage(outcome.failureCode) ?? "Virement non exécuté");
                  },
                  onError: (error) => toast.error(transferErrorMessage(error)),
                })
              }
            >
              Reprendre et confirmer
            </Button>
          </div>
        ) : null}
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-foreground">Suivi du virement</h2>
        <ol className="mt-3 space-y-3" role="list">
          {data.timeline.map((event, index) => (
            <li key={`${event.status}-${index}`} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-1.5 size-2 shrink-0 rounded-full bg-border"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {transferStatusLabel(event.status)}
                </p>
                <p className="text-caption text-muted-foreground">
                  {formatDateTime(event.occurredAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
