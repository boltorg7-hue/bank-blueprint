import type { StatusTone } from "@/components/ui/status-badge";
import type {
  TransferFailureCode,
  TransferKind,
  TransferStatus,
} from "@/features/transfers/types/transfer";

/**
 * Presentation vocabulary for transfers (§141 – §148, §158 ; PROMPT 08 §86).
 * Customer wording only: never a technical code, never an internal detail.
 */

const STATUS_LABELS: Record<TransferStatus, string> = {
  DRAFT: "Brouillon",
  READY_FOR_CONFIRMATION: "À confirmer",
  CONFIRMED: "Confirmé",
  FUNDS_RESERVED: "Fonds réservés",
  PROCESSING: "En cours d'exécution",
  COMPLIANCE_REVIEW: "En cours de vérification",
  DOCUMENT_REQUIRED: "Action requise",
  APPROVED: "Approuvé",
  SETTLEMENT_PENDING: "Confirmation finale en attente",
  COMPLETED: "Exécuté",
  FAILED: "Échoué",
  REJECTED: "Refusé",
  CANCELLED: "Annulé",
  BLOCKED: "Suspendu",
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
  SETTLEMENT_PENDING: "pending",
  COMPLETED: "success",
  FAILED: "failed",
  REJECTED: "failed",
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
  DESTINATION_NOT_SUPPORTED:
    "Cette destination n'est pas prise en charge actuellement. Aucun virement n'a été engagé.",
  DESTINATION_IS_INTERNAL:
    "Ce compte est détenu chez nous : enregistrez-le comme bénéficiaire de notre banque, le virement sera immédiat.",
  CURRENCY_MISMATCH:
    "La devise du compte destinataire diffère de celle de votre compte : ce virement n'est pas possible.",
  BENEFICIARY_UNAVAILABLE: "Ce bénéficiaire n'est plus disponible pour un virement.",
  SOURCE_ACCOUNT_UNAVAILABLE: "Le compte à débiter n'est pas disponible pour un virement.",
  INVALID_AMOUNT: "Le montant saisi n'est pas valide.",
  INVALID_DESTINATION: "Les coordonnées du bénéficiaire saisies ne sont pas valides.",
  INVALID_TRANSITION: "Ce virement ne peut plus être modifié à ce stade.",
  TRANSFER_UNAVAILABLE: "Ce virement n'est pas disponible.",
  SETTLEMENT_FAILED:
    "La banque destinataire n'a pas pu recevoir ce virement. Les fonds réservés ont été rendus disponibles.",
  COMPLIANCE_REJECTED:
    "Ce virement n'a pas été autorisé après vérification. Les fonds réservés ont été rendus disponibles.",
  PROCESSING_ERROR:
    "Le virement n'a pas pu être exécuté. Aucun montant n'a été débité ; vous pouvez réessayer.",
  UNEXPECTED_ERROR:
    "Le virement n'a pas pu être traité. Aucun montant n'a été débité ; vous pouvez réessayer.",
};

export function transferStatusLabel(status: TransferStatus): string {
  return STATUS_LABELS[status] ?? "En cours de traitement";
}

export function transferStatusTone(status: TransferStatus): StatusTone {
  return STATUS_TONES[status] ?? "pending";
}

export function transferFailureMessage(code: TransferFailureCode | null): string | null {
  if (!code) return null;
  return FAILURE_MESSAGES[code] ?? FAILURE_MESSAGES.UNEXPECTED_ERROR;
}

/** Customer wording for the route, never the technical enum (§84, §86). */
export function transferKindLabel(kind: TransferKind): string {
  return kind === "INTERNAL_TRANSFER" ? "Virement dans notre banque" : "Virement vers une autre banque";
}

export function transferKindShortLabel(kind: TransferKind): string {
  return kind === "INTERNAL_TRANSFER" ? "Notre banque" : "Autre banque";
}

/** Maps a thrown server-function error to a customer message. */
export function transferErrorMessage(error: unknown): string {
  const message = String((error as { message?: string } | null)?.message ?? "");
  const known = (Object.keys(FAILURE_MESSAGES) as TransferFailureCode[]).find((code) =>
    message.includes(code),
  );
  if (known) return FAILURE_MESSAGES[known];
  if (message.includes("REQUIREMENT_NOT_OPEN"))
    return "Ce justificatif a déjà été transmis et est en cours d'examen.";
  if (message.includes("REQUIREMENT_UNAVAILABLE"))
    return "Ce justificatif n'est plus demandé pour ce virement.";
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
