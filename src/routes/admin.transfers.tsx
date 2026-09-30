import { useLanguage } from "@/components/providers/LanguageProvider";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, FileCheck2, Send } from "lucide-react";
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
      { title: "Virements en attente — RFC Royal FINANCE Bank" },
      { name: "description", content: "Suivi administratif sécurisé des virements externes en attente." },
      { property: "og:title", content: "Virements en attente — RFC Royal FINANCE Bank" },
      { property: "og:description", content: "Suivi administratif sécurisé des virements externes en attente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
        title={en ? "Pending transfers" : "Virements en attente"}
        description={en ? "Track each amount, recipient and processing status." : "Suivez chaque montant, destinataire et statut de traitement."}
      />
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState title={en ? "No pending transfers" : "Aucun virement en attente"} />
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
    <>
    <div className="native-list md:hidden">
      {transfers.map((transfer) => {
        const canApprove = transfer.status === "COMPLIANCE_REVIEW" && transfer.documentsOpen === 0 && permissions.has("compliance.review");
        const canQueue = transfer.status === "APPROVED" && permissions.has("transfers.approve");
        const canFinalize = transfer.status === "SETTLEMENT_PENDING" && permissions.has("transfers.approve");
        const action = canApprove ? "APPROVE" : canQueue ? "QUEUE" : canFinalize ? "FINALIZE" : null;
        return <article key={transfer.reference} className="native-list-item block space-y-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-xs text-muted-foreground">{transfer.reference}</p><p className="mt-1 truncate font-semibold">{transfer.recipient}</p><p className="text-sm text-muted-foreground">{transfer.customerName}</p></div><StatusBadge label={transfer.status} tone={statusTone(transfer.status)} /></div>
          <p className="text-xl font-semibold">{formatMoneyFromMinor(transfer.amountMinor, { currency: transfer.currency })}</p>
          <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowRight className="size-3.5" />{en ? "Progress" : "Progression"}</p><p className="mt-1 font-medium">{transfer.progressPercent} %</p></div><div><p className="flex items-center gap-1 text-xs text-muted-foreground"><FileCheck2 className="size-3.5" />{en ? "Documents" : "Justificatifs"}</p><p className="mt-1 font-medium">{transfer.documentsOpen === 0 ? (en ? "Complete" : "Complets") : `${transfer.documentsOpen} ${en ? "open" : "ouvert(s)"}`}</p></div></div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{formatDateTime(transfer.createdAt)}</p>
          {action ? <Button className="w-full" disabled={mutation.isPending} onClick={() => advance(transfer.reference, action)}><Send className="size-4" />{action === "APPROVE" ? (en ? "Approve at 95%" : "Approuver à 95 %") : action === "QUEUE" ? (en ? "Move to 99%" : "Passer à 99 %") : (en ? "Finalize at 100%" : "Finaliser à 100 %")}</Button> : null}
        </article>;
      })}
    </div>
    <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
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
    </>
  );
}
