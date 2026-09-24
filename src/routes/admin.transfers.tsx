import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminGate } from "@/features/admin/components/AdminGate";
import {
  useAdminContext,
  useAdminExternalTransfers,
  useAdvanceExternalTransfer,
} from "@/features/admin/hooks/useAdmin";
import type { AdminExternalTransferDto } from "@/features/admin/types/admin";
import { formatDateTime, formatMoneyFromMinor } from "@/lib/format";

export const Route = createFileRoute("/admin/transfers")({
  component: AdminTransfersPage,
  head: () => ({
    meta: [
      { title: "Transferts externes — Back-office" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function statusTone(status: string): "success" | "failed" | "pending" | "info" {
  if (status === "COMPLETED") return "success";
  if (["FAILED", "REJECTED", "CANCELLED"].includes(status)) return "failed";
  return status === "DOCUMENT_REQUIRED" ? "pending" : "info";
}

function AdminTransfersPage() {
  const query = useAdminExternalTransfers();

  return (
    <AdminGate>
      <PageHeader
        title="Transferts externes simulés"
        description="Contrôlez les justificatifs et les passages administratifs à 95 %, 99 % et 100 %."
      />
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState title="Aucun transfert externe" />
      ) : (
        <ExternalTransfersTable transfers={query.data} />
      )}
    </AdminGate>
  );
}

function ExternalTransfersTable({ transfers }: { transfers: AdminExternalTransferDto[] }) {
  const context = useAdminContext();
  const mutation = useAdvanceExternalTransfer();
  const permissions = new Set(context.data?.permissions ?? []);

  async function advance(reference: string, action: "APPROVE" | "QUEUE" | "FINALIZE") {
    try {
      await mutation.mutateAsync({ reference, action });
      toast.success(
        action === "APPROVE"
          ? "Transfert approuvé à 95 %."
          : action === "QUEUE"
            ? "Transfert placé à 99 %."
            : "Simulation finalisée à 100 %.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.includes("FOUR_EYES_REQUIRED")
          ? "Un autre agent autorisé doit effectuer cette étape."
          : "La transition n’a pas pu être enregistrée.",
      );
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Référence</TableHead>
            <TableHead>Client / bénéficiaire</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>État</TableHead>
            <TableHead>Justificatifs</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.map((transfer) => {
            const canApprove =
              transfer.status === "COMPLIANCE_REVIEW" &&
              transfer.documentsOpen === 0 &&
              permissions.has("compliance.review");
            const canQueue = transfer.status === "APPROVED" && permissions.has("transfers.approve");
            const canFinalize =
              transfer.status === "SETTLEMENT_PENDING" && permissions.has("transfers.approve");
            const action = canApprove ? "APPROVE" : canQueue ? "QUEUE" : canFinalize ? "FINALIZE" : null;

            return (
              <TableRow key={transfer.reference}>
                <TableCell className="font-mono text-xs">{transfer.reference}</TableCell>
                <TableCell>
                  <div className="font-medium">{transfer.customerName}</div>
                  <div className="text-sm text-muted-foreground">{transfer.recipient}</div>
                </TableCell>
                <TableCell>{formatMoneyFromMinor(transfer.amountMinor, { currency: transfer.currency })}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <StatusBadge label={transfer.status} tone={statusTone(transfer.status)} />
                    <div className="text-xs text-muted-foreground">{transfer.progressPercent} %</div>
                  </div>
                </TableCell>
                <TableCell>{transfer.documentsOpen === 0 ? "Complets" : `${transfer.documentsOpen} ouvert(s)`}</TableCell>
                <TableCell>{formatDateTime(transfer.createdAt)}</TableCell>
                <TableCell className="text-right">
                  {action ? (
                    <Button
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => advance(transfer.reference, action)}
                    >
                      {action === "APPROVE"
                        ? "Approuver à 95 %"
                        : action === "QUEUE"
                          ? "Passer à 99 %"
                          : "Finaliser à 100 %"}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Aucune action</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
