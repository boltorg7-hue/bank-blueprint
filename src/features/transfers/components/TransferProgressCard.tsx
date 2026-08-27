import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { TransferDetailDto } from "@/features/transfers/types/transfer";
import {
  openRequirement,
  progressAnnouncement,
  progressExplanation,
  progressStateLabel,
  progressTone,
} from "@/features/transfers/utils/transfer-progress";
import { transferKindLabel } from "@/features/transfers/utils/transfer-display";
import { formatDateTime } from "@/lib/format/date";
import { cn } from "@/lib/utils";

/**
 * Progress of a transfer (PROMPT 08 §65 – §73, §91).
 *
 * The percentage comes from the server and is never animated towards a value
 * the workflow has not reached. 99 % is presented as an honest waiting state,
 * never as a success.
 */
export function TransferProgressCard({
  transfer,
  onRefresh,
  isRefreshing = false,
}: {
  transfer: TransferDetailDto;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  const tone = progressTone(transfer);
  const requirement = openRequirement(transfer.requirements);
  const explanation = progressExplanation(transfer, requirement);

  const barClass =
    tone === "success"
      ? "[&>div]:bg-success"
      : tone === "attention"
        ? "[&>div]:bg-warning"
        : tone === "failed"
          ? "[&>div]:bg-danger"
          : "[&>div]:bg-primary";

  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "attention"
        ? ShieldAlert
        : tone === "failed"
          ? AlertTriangle
          : Clock;

  const iconColour =
    tone === "success"
      ? "text-success"
      : tone === "attention"
        ? "text-warning"
        : tone === "failed"
          ? "text-danger"
          : "text-muted-foreground";

  const canRefresh =
    Boolean(onRefresh) &&
    transfer.kind === "EXTERNAL_TRANSFER" &&
    transfer.status === "SETTLEMENT_PENDING";

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", iconColour)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {progressStateLabel(transfer.progressState)}
          </p>
          <p className="text-caption text-muted-foreground">{transferKindLabel(transfer.kind)}</p>
        </div>
        <p className="text-amount shrink-0 text-sm font-semibold text-foreground">
          {transfer.progressPercent} %
        </p>
      </div>

      <div>
        <Progress
          value={transfer.progressPercent}
          className={cn("h-2", barClass)}
          aria-hidden="true"
        />
        {/* Progress is never conveyed by colour or position alone (§91). */}
        <p className="sr-only" role="status">
          {progressAnnouncement(transfer)}
        </p>
      </div>

      <p className="text-sm text-muted-foreground">{explanation}</p>

      {transfer.settlementIsSimulated && transfer.kind === "EXTERNAL_TRANSFER" ? (
        <p className="text-caption rounded-lg border border-border bg-surface-sunken p-3 text-muted-foreground">
          Ce virement suit un circuit de règlement de démonstration : aucun mouvement de fonds réel
          n'a lieu vers une autre banque tant que la banque n'a pas raccordé le réseau définitif.
        </p>
      ) : null}

      {transfer.fundsReserved && transfer.status !== "COMPLETED" ? (
        <p className="text-caption text-muted-foreground">
          Le montant est réservé sur votre compte : il n'est plus disponible pour une autre
          opération, mais il n'est définitivement débité qu'à l'issue du virement.
        </p>
      ) : null}

      {transfer.finalizedAt ? (
        <p className="text-caption text-muted-foreground">
          Dernière étape enregistrée le {formatDateTime(transfer.finalizedAt)}.
        </p>
      ) : null}

      {canRefresh ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          {isRefreshing ? <Spinner className="size-4" /> : null}
          Actualiser le suivi
        </Button>
      ) : null}
    </Card>
  );
}
