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

const STATUS_LABELS_EN: Record<TransferStatus, string> = {
  DRAFT: "Draft", READY_FOR_CONFIRMATION: "Awaiting confirmation", CONFIRMED: "Confirmed",
  FUNDS_RESERVED: "Funds reserved", PROCESSING: "Processing", COMPLIANCE_REVIEW: "Under review",
  DOCUMENT_REQUIRED: "Action required", APPROVED: "Approved", SETTLEMENT_PENDING: "Final confirmation pending",
  COMPLETED: "Completed", FAILED: "Failed", REJECTED: "Declined", CANCELLED: "Cancelled",
  BLOCKED: "Suspended", REVERSED: "Reversed",
};
export function transferStatusLabel(status: TransferStatus, language: "fr" | "en" = "fr"): string {
  return language === "en" ? STATUS_LABELS_EN[status] ?? "Processing" : STATUS_LABELS[status] ?? "En cours de traitement";
}

export function transferStatusTone(status: TransferStatus): StatusTone {
  return STATUS_TONES[status] ?? "pending";
}

const FAILURE_MESSAGES_EN: Record<TransferFailureCode, string> = {
  INSUFFICIENT_FUNDS: "Your available balance is insufficient. No amount was debited.",
  LIMIT_EXCEEDED: "This transfer exceeds an applicable account limit. No amount was debited.",
  ACCOUNT_RESTRICTED: "Transfers are unavailable with your account's current status.",
  DESTINATION_UNAVAILABLE: "The recipient account cannot receive this transfer. Check the saved beneficiary.",
  DESTINATION_NOT_SUPPORTED: "This destination is not currently supported. No transfer was initiated.",
  DESTINATION_IS_INTERNAL: "This account is held with us. Save it as an internal beneficiary for an immediate transfer.",
  CURRENCY_MISMATCH: "The recipient account uses a different currency. This transfer is not possible.",
  BENEFICIARY_UNAVAILABLE: "This beneficiary is no longer available for transfers.",
  SOURCE_ACCOUNT_UNAVAILABLE: "The source account is unavailable for transfers.",
  INVALID_AMOUNT: "The amount entered is not valid.", INVALID_DESTINATION: "The beneficiary details are not valid.",
  INVALID_TRANSITION: "This transfer can no longer be modified at this stage.", TRANSFER_UNAVAILABLE: "This transfer is unavailable.",
  SETTLEMENT_FAILED: "The receiving bank could not receive this transfer. Reserved funds have been released.",
  COMPLIANCE_REJECTED: "This transfer was not authorized after review. Reserved funds have been released.",
  PROCESSING_ERROR: "The transfer could not be executed. No amount was debited; you can try again.",
  UNEXPECTED_ERROR: "The transfer could not be processed. No amount was debited; you can try again.",
};
export function transferFailureMessage(code: TransferFailureCode | null, language: "fr" | "en" = "fr"): string | null {
  if (!code) return null;
  return language === "en" ? FAILURE_MESSAGES_EN[code] ?? FAILURE_MESSAGES_EN.UNEXPECTED_ERROR : FAILURE_MESSAGES[code] ?? FAILURE_MESSAGES.UNEXPECTED_ERROR;
}

/** Customer wording for the route, never the technical enum (§84, §86). */
export function transferKindLabel(kind: TransferKind, language: "fr" | "en" = "fr"): string {
  return language === "en"
    ? kind === "INTERNAL_TRANSFER" ? "Internal transfer" : "External transfer"
    : kind === "INTERNAL_TRANSFER" ? "Virement dans notre banque" : "Virement vers une autre banque";
}

export function transferKindShortLabel(kind: TransferKind, language: "fr" | "en" = "fr"): string {
  return language === "en"
    ? kind === "INTERNAL_TRANSFER" ? "Our bank" : "Other bank"
    : kind === "INTERNAL_TRANSFER" ? "Notre banque" : "Autre banque";
}

/** Maps a thrown server-function error to a customer message. */
export function transferErrorMessage(error: unknown, language: "fr" | "en" = "fr"): string {
  const message = String((error as { message?: string } | null)?.message ?? "");
  const known = (Object.keys(FAILURE_MESSAGES) as TransferFailureCode[]).find((code) =>
    message.includes(code),
  );
  if (known) return transferFailureMessage(known, language) ?? (language === "en" ? "The transfer could not be processed." : FAILURE_MESSAGES.UNEXPECTED_ERROR);
  if (message.includes("REQUIREMENT_NOT_OPEN"))
    return language === "en" ? "This document has already been submitted and is under review." : "Ce justificatif a déjà été transmis et est en cours d'examen.";
  if (message.includes("REQUIREMENT_UNAVAILABLE"))
    return language === "en" ? "This document is no longer required for this transfer." : "Ce justificatif n'est plus demandé pour ce virement.";
  if (message.includes("RECENT_AUTHENTICATION_REQUIRED"))
    return language === "en" ? "Your password could not be confirmed. Check it and try again." : "Votre mot de passe n’a pas pu être confirmé. Vérifiez-le puis réessayez.";
  return language === "en" ? FAILURE_MESSAGES_EN.UNEXPECTED_ERROR : FAILURE_MESSAGES.UNEXPECTED_ERROR;
}

/** Progress copy for an in-flight execution (§120, §143). */
export function transferProgressLabel(status: TransferStatus, language: "fr" | "en" = "fr"): string {
  if (language === "en") {\n    switch (status) {\n      case "CONFIRMED": return "Verifying your transfer…";\n      case "FUNDS_RESERVED": return "Reserving funds…";\n      case "PROCESSING": return "Processing the transfer…";\n      default: return "Processing…";\n    }\n  }\n  switch (status) {
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
