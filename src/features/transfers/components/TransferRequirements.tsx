import { useRef, useState } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { useUploadTransferDocument } from "@/features/transfers/hooks/useTransfers";
import type {
  TransferDocumentDto,
  TransferRequirementDto,
} from "@/features/transfers/types/transfer";
import {
  rejectionMessage,
  requirementStatusLabel,
} from "@/features/transfers/utils/transfer-progress";
import { formatDateTime } from "@/lib/format/date";

const ACCEPTED = "image/jpeg,image/png,image/heic,application/pdf";
const MAX_BYTES = 15 * 1024 * 1024;

const STATUS_TONES = {
  REQUIRED: "pending",
  SUBMITTED: "info",
  UNDER_REVIEW: "pending",
  SATISFIED: "success",
  REPLACEMENT_REQUIRED: "failed",
  WAIVED: "neutral",
  EXPIRED: "failed",
} as const;

/**
 * Supporting documents requested for a transfer (PROMPT 08 §29 – §40, §92).
 *
 * The customer always sees WHY a document is needed, what happens to the funds
 * meanwhile, and a plain-language reason if a document was refused. Uploading
 * never completes the transfer by itself: the bank still reviews it.
 */
export function TransferRequirements({
  reference,
  requirements,
  documents,
}: {
  reference: string;
  requirements: TransferRequirementDto[];
  documents: TransferDocumentDto[];
}) {
  if (requirements.length === 0) return null;

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Justificatifs demandés</h2>
        <p className="text-caption text-muted-foreground">
          Ces documents sont exigés par la réglementation avant l'exécution du virement. Le montant
          reste réservé sur votre compte pendant l'examen.
        </p>
      </div>

      <ul className="space-y-3" role="list">
        {requirements.map((requirement) => (
          <li key={requirement.id}>
            <RequirementRow
              reference={reference}
              requirement={requirement}
              documents={documents.filter((doc) => doc.requirementId === requirement.id)}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RequirementRow({
  reference,
  requirement,
  documents,
}: {
  reference: string;
  requirement: TransferRequirementDto;
  documents: TransferDocumentDto[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const upload = useUploadTransferDocument();

  const isOpen =
    requirement.status === "REQUIRED" || requirement.status === "REPLACEMENT_REQUIRED";
  const refusal = rejectionMessage(requirement.rejectionReasonCode);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{requirement.title}</p>
          {requirement.description ? (
            <p className="text-caption text-muted-foreground">{requirement.description}</p>
          ) : null}
          <p className="text-caption text-muted-foreground">
            Demandé le {formatDateTime(requirement.requestedAt)}
          </p>
        </div>
        <StatusBadge
          label={requirementStatusLabel(requirement.status)}
          tone={STATUS_TONES[requirement.status]}
        />
      </div>

      {refusal ? (
        <p role="alert" className="text-caption mt-2 text-danger">
          {refusal} Transmettez un nouveau document pour poursuivre.
        </p>
      ) : null}

      {documents.length > 0 ? (
        <ul className="mt-3 space-y-1" role="list">
          {documents.map((document) => (
            <li
              key={document.id}
              className="text-caption flex items-center gap-2 text-muted-foreground"
            >
              <FileCheck2 className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {document.originalFilename ?? "Document transmis"} ·{" "}
                {formatDateTime(document.uploadedAt)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {isOpen ? (
        <div className="mt-3 space-y-2">
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={ACCEPTED}
            aria-label={`Transmettre le justificatif : ${requirement.title}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setError(null);
              if (file.size > MAX_BYTES) {
                setError("Le fichier dépasse 15 Mo. Transmettez une version plus légère.");
                return;
              }
              upload.mutate(
                { reference, requirementId: requirement.id, file },
                {
                  onSuccess: () =>
                    toast.success("Document transmis. Nos équipes procèdent à sa vérification."),
                  onError: () =>
                    setError("L'envoi n'a pas abouti. Vérifiez le fichier, puis réessayez."),
                },
              );
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            {upload.isPending ? "Envoi en cours…" : "Transmettre le document"}
          </Button>
          <p className="text-caption text-muted-foreground">
            Formats acceptés : JPG, PNG, HEIC ou PDF, jusqu'à 15 Mo. Vos documents restent privés et
            ne sont consultables que par les équipes habilitées de la banque.
          </p>
          {error ? (
            <p role="alert" className="text-caption text-danger">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
