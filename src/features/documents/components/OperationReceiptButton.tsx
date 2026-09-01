import { FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DocumentActions } from "@/features/documents/components/DocumentActions";
import {
  useGenerateReceipt,
  useOperationReceipt,
} from "@/features/documents/hooks/useDocuments";
import { documentErrorMessage } from "@/features/documents/types/document";

/**
 * Receipt entry point on a transfer or transaction detail (PROMPT 09 §74 – §84).
 *
 * A receipt is only offered for a fully completed operation: `available` is
 * decided by the caller from server state, and the server re-checks it anyway.
 */
export function OperationReceiptButton({
  documentType,
  sourceReference,
  available,
  unavailableHint,
}: {
  documentType: "TRANSFER_RECEIPT" | "TRANSACTION_RECEIPT";
  sourceReference: string;
  available: boolean;
  unavailableHint?: string;
}) {
  const existing = useOperationReceipt(documentType, sourceReference, available);
  const generate = useGenerateReceipt();

  if (!available) {
    return (
      <p className="text-caption text-muted-foreground">
        {unavailableHint ??
          "Le reçu définitif sera disponible dès la confirmation complète de l'opération."}
      </p>
    );
  }

  const receipt = existing.data;
  if (receipt && receipt.status === "READY") {
    return <DocumentActions reference={receipt.reference} />;
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full sm:w-auto"
      disabled={generate.isPending || existing.isPending}
      onClick={() =>
        generate.mutate(
          { documentType, sourceReference },
          {
            onSuccess: () => toast.success("Reçu disponible dans vos documents"),
            onError: (error) => toast.error(documentErrorMessage(error.message)),
          },
        )
      }
    >
      <FileText aria-hidden className="mr-2 size-4" />
      {generate.isPending ? "Génération du reçu…" : "Obtenir le reçu"}
    </Button>
  );
}
