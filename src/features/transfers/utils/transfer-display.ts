import type { StatusTone } from "@/components/ui/status-badge";
import type {
  TransferFailureCode,
  TransferStatus,
} from "@/features/transfers/types/transfer";

/**
 * Presentation vocabulary for transfers (§141 – §148, §158).
 * Customer wording only: never a technical code, never an internal detail.
 */

const STATUS_LABELS: Record<TransferStatus, string> = {
  DRAFT: "Brouillon",
  READY_FOR_CONFIRMATION: "À confirmer",
  CONFIRMED: "Confirmé",
  FUNDS_RESERVED: "Fonds réservés",
  PROCESSING: "En cours d'exécution",
  COMPLIANCE_REVIEW: "En cours de vérification",
  DOCUMENT_REQUIRED: "Document requis",
  APPROVED: "Approuvé",
  COMPLETED: "Exécuté",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  BLOCKED: "Bloqué",
  REVERSED: "Contre-passé",
};

const STATUS_TONES: Record<TransferStatus, StatusTone> = {
  DRAFT: "neutral",
  READY_FOR_CONFIRMATION: "info",
  CONFIRMED: "info",
  FUNDS_RESERVED: "pending",
  PROCESSING: "pending",
  COMPLIANCE_REVIEW: "pending",
  DOCUMENT_REQUIRED: "pending",
  APPROVED: "info",
  COMPLETED: "success",
  FAILED: "failed",
  CANCELLED: "neutral",
  BLOCKED: "failed",
  REVERSED: "neutral",
};

const FAILURE_MESSAGES: Record<TransferFailureCode, string> = {
  INSUFFICIENT_FUNDS:
    "Le solde disponible de votre compte ne permet pas d'exécuter ce virement. Aucun montant n'a été débité.",
  LIMIT_EXCEEDED:
    "Ce virement dépasse un plafond applicable à votre compte. Aucun montant n'a été débité.",
  ACCOUNT_RESTRICTED:
    "Les virements ne sont pas disponibles avec le statut actuel de votre compte.",
  DESTINATION_UNAVAILABLE:
    "Le compte destinataire ne peut pas recevoir ce virement. Vérifiez le bénéficiaire enregistré.",
  CURRENCY_MISMATCH:
    "La devise du compte destinataire diffère de celle de votre compte : ce virement n'est pas possible.",
  BENEFICIARY_UNAVAILABLE: "Ce bénéficiaire n'est plus disponible pour un virement.",
  SOURCE_ACCOUNT_UNAVAILABLE: "Le compte à débiter n'est pas disponible pour un virement.",
  INVALID_AMOUNT: "Le montant saisi n'est pas valide.",
  INVALID_TRANSITION: "Ce virement ne peut plus être modifié à ce stade.",
  TRANSFER_UNAVAILABLE: "Ce virement n'est pas disponible.",
  PROCESSING_ERROR:
    "Le virement n'a pas pu être exécuté. Aucun montant n'a été débité ; vous pouvez réessayer.",
  UNEXPECTED_ERROR:
    "Le virement n'a pas pu être traité. Aucun montant n'a été débité ; vous pouvez réessayer.",
};

export function transferStatusLabel(status: TransferStatus): string {
  return STATUS_LABELS[status];
}

export function transferStatusTone(status: TransferStatus): StatusTone {
  return STATUS_TONES[status];
}

export function transferFailureMessage(code: TransferFailureCode | null): string | null {
  if (!code) return null;
  return FAILURE_MESSAGES[code] ?? FAILURE_MESSAGES.UNEXPECTED_ERROR;
}

/** Maps a thrown server-function error to a customer message. */
export function transferErrorMessage(error: unknown): string {
  const message = String((error as { message?: string } | null)?.message ?? "");
  const known = (Object.keys(FAILURE_MESSAGES) as TransferFailureCode[]).find((code) =>
    message.includes(code),
  );
  if (known) return FAILURE_MESSAGES[known];
  if (message.includes("INVALID_AMOUNT")) return FAILURE_MESSAGES.INVALID_AMOUNT;
  return FAILURE_MESSAGES.UNEXPECTED_ERROR;
}

/** Progress copy for an in-flight execution (§120, §143). */
export function transferProgressLabel(status: TransferStatus): string {
  switch (status) {
    case "CONFIRMED":
      return "Vérification de votre virement…";
    case "FUNDS_RESERVED":
      return "Réservation des fonds…";
    case "PROCESSING":
      return "Exécution du virement…";
    default:
      return "Traitement en cours…";
  }
}
