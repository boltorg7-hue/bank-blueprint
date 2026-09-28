import { useLanguage } from "@/components/providers/LanguageProvider";
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
  const { language } = useLanguage();
  const en = language === "en";
  const query = useAdminExternalTransfers();

  return (
    <AdminGate>
      <PageHeader
        title={en ? "Simulated external transfers" : "Transferts externes simulés"}
        description={en ? "Review supporting documents and the administrative stages at 95%, 99% and 100%." : "Contrôlez les justificatifs et les passages administratifs à 95 %, 99 % et 100 %."}
      />
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState title={en ? "No external transfers" : "Aucun transfert externe"} />
      ) : (
        <ExternalTransfersTable transfers={query.data} />
      )}
    </AdminGate>
  );
}

function ExternalTransfersTable({ transfers }: { transfers: AdminExternalTransferDto[] }) {
  const { language } = useLanguage();
  const en = language === "en";
  const context = useAdminContext();
  const mutation = useAdvanceExternalTransfer();
  const permissions = new Set(context.data?.permissions ?? []);

  async function advance(reference: string, action: "APPROVE" | "QUEUE" | "FINALIZE") {
    try {
      await mutation.mutateAsync({ reference, action });
      toast.success(
        action === "APPROVE"
          ? (en ? "Transfer approved at 95%." : "Transfert approuvé à 95 %.")
          : action === "QUEUE"
            ? (en ? "Transfer queued at 99%." : "Transfert placé à 99 %.")
            : (en ? "Simulation completed at 100%." : "Simulation finalisée à 100 %."),
      );
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.includes("FOUR_EYES_REQUIRED")
          ? (en ? "Another authorized staff member must complete this step." : "Un autre agent autorisé doit effectuer cette étape.")
          : (en ? "The transition could not be saved." : "La transition n’a pas pu être enregistrée."),
      );
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{en ? "Reference" : "Référence"}</TableHead>
            <TableHead>{en ? "Customer / beneficiary" : "Client / bénéficiaire"}</TableHead>
            <TableHead>{en ? "Amount" : "Montant"}</TableHead>
            <TableHead>{en ? "Status" : "État"}</TableHead>
            <TableHead>{en ? "Documents" : "Justificatifs"}</TableHead>
            <TableHead>{en ? "Created" : "Créé le"}</TableHead>
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
                <TableCell>{transfer.documentsOpen === 0 ? (en ? "Complete" : "Complets") : `${transfer.documentsOpen} ${en ? "open" : "ouvert(s)"}`}</TableCell>
                <TableCell>{formatDateTime(transfer.createdAt)}</TableCell>
                <TableCell className="text-right">
                  {action ? (
                    <Button
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => advance(transfer.reference, action)}
                    >
                      {action === "APPROVE"
                        ? (en ? "Approve at 95%" : "Approuver à 95 %")
                        : action === "QUEUE"
                          ? (en ? "Move to 99%" : "Passer à 99 %")
                          : (en ? "Finalize at 100%" : "Finaliser à 100 %")}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">{en ? "No action" : "Aucune action"}</span>
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
