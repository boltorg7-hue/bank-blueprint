import { useState } from "react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminTransferDocumentUrl,
  useReviewAdminTransferDocument,
} from "@/features/admin/hooks/useTransferDocumentReview";
import type { AdminTransferDocumentDto } from "@/features/admin/types/transfer-document-review";
import { formatDateTime } from "@/lib/format";

function statusTone(status: string): "success" | "failed" | "pending" | "info" {
  if (status === "ACCEPTED") return "success";
  if (status === "REJECTED") return "failed";
  if (status === "UPLOADED" || status === "UNDER_REVIEW") return "pending";
  return "info";
}

export function TransferDocumentsReview({
  documents,
}: {
  documents: AdminTransferDocumentDto[];
}) {
  const { language } = useLanguage();
  const en = language === "en";
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const openDocument = useAdminTransferDocumentUrl();
  const reviewDocument = useReviewAdminTransferDocument();

  if (documents.length === 0) return null;

  async function viewDocument(documentId: string) {
    const preview = window.open("about:blank", "_blank");
    if (preview) preview.opener = null;
    try {
      const result = await openDocument.mutateAsync({ documentId });
      if (preview) preview.location.href = result.url;
      else window.location.assign(result.url);
    } catch {
      preview?.close();
      toast.error(en ? "The document could not be opened." : "Le document ne peut pas être ouvert.");
    }
  }

  async function decide(documentId: string, accept: boolean) {
    const reason = reasons[documentId] ?? "";
    try {
      await reviewDocument.mutateAsync({ documentId, accept, reason });
      setReasons((current) => ({ ...current, [documentId]: "" }));
      toast.success(
        accept
          ? (en ? "Document accepted." : "Justificatif accepté.")
          : (en ? "Replacement requested." : "Remplacement demandé."),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message === "DOCUMENT_ALREADY_FINALIZED"
          ? (en ? "This document has already been reviewed." : "Ce justificatif a déjà été examiné.")
          : (en ? "The document decision could not be saved." : "La décision documentaire n’a pas été enregistrée."),
      );
    }
  }

  return (
    <details className="mt-3 rounded-lg border border-border bg-background p-3">
      <summary className="cursor-pointer text-sm font-medium">
        {en ? "Review documents" : "Examiner les justificatifs"} ({documents.length})
      </summary>
      <div className="mt-3 space-y-3">
        {documents.map((document) => {
          const pending = ["UPLOADED", "UNDER_REVIEW"].includes(document.status);
          const reason = reasons[document.id] ?? "";
          return (
            <article key={document.id} className="space-y-3 rounded-md border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{document.documentType}</p>
                  <p className="break-all text-xs text-muted-foreground">
                    {document.originalFilename ?? (en ? "Unnamed document" : "Document sans nom")}
                  </p>
                </div>
                <StatusBadge label={document.status} tone={statusTone(document.status)} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {en ? "Uploaded" : "Déposé"} : {formatDateTime(document.uploadedAt)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={openDocument.isPending}
                  onClick={() => void viewDocument(document.id)}
                >
                  {en ? "View file" : "Voir le fichier"}
                </Button>
              </div>
              {pending ? (
                <div className="space-y-2">
                  <Textarea
                    value={reason}
                    maxLength={500}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [document.id]: event.target.value,
                      }))
                    }
                    placeholder={
                      en
                        ? "Reason for replacement (8–500 characters)"
                        : "Motif du remplacement (8 à 500 caractères)"
                    }
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={reviewDocument.isPending}
                      onClick={() => void decide(document.id, true)}
                    >
                      {en ? "Accept" : "Accepter"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={
                        reviewDocument.isPending ||
                        reason.trim().length < 8 ||
                        reason.trim().length > 500
                      }
                      onClick={() => void decide(document.id, false)}
                    >
                      {en ? "Request replacement" : "Demander un remplacement"}
                    </Button>
                  </div>
                </div>
              ) : null}
              {document.history.length > 0 ? (
                <div className="border-t border-border pt-2">
                  <p className="text-xs font-semibold">
                    {en ? "Review history" : "Historique des décisions"}
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                    {document.history.map((entry) => (
                      <li key={entry.id}>
                        {formatDateTime(entry.createdAt)} · {entry.actorName} · {entry.decision}
                        {entry.reasonCode ? " — " + entry.reasonCode : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </details>
  );
}
