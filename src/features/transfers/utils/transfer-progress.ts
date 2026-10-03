/**
 * Single progress vocabulary for the whole app (PROMPT 08 §26, §65 – §68).
 *
 * The percentage itself always comes from the server. This module only turns a
 * trusted state into customer wording, tone and an accessible announcement.
 * Never derive a percentage from elapsed time here.
 */
import type {
  TransferDto,
  TransferProgressState,
  TransferRequirementDto,
  TransferRequirementStatus,
  TransferStatus,
} from "@/features/transfers/types/transfer";

export type ProgressTone = "neutral" | "progress" | "attention" | "success" | "failed";

const STATE_LABELS: Record<TransferProgressState, string> = {
  CREATED: "Virement créé",
  ACCOUNT_VALIDATED: "Compte vérifié",
  FUNDS_VALIDATED: "Fonds vérifiés",
  SECURITY_CONFIRMED: "Confirmation de sécurité effectuée",
  COMPLIANCE_CHECK: "Contrôles réglementaires en cours",
  DOCUMENT_REQUIRED: "Document à fournir",
  DOCUMENT_REVIEW: "Document en cours d'examen",
  FINAL_REVIEW: "Vérification finale par la banque",
  APPROVED: "Virement approuvé",
  SETTLEMENT_PENDING: "Confirmation finale en attente",
  COMPLETED: "Virement terminé",
  FAILED: "Virement non exécuté",
  CANCELLED: "Virement annulé",
  BLOCKED: "Virement suspendu",
};

const STATE_TONES: Record<TransferProgressState, ProgressTone> = {
  CREATED: "neutral",
  ACCOUNT_VALIDATED: "progress",
  FUNDS_VALIDATED: "progress",
  SECURITY_CONFIRMED: "progress",
  COMPLIANCE_CHECK: "progress",
  DOCUMENT_REQUIRED: "attention",
  DOCUMENT_REVIEW: "progress",
  FINAL_REVIEW: "progress",
  APPROVED: "progress",
  SETTLEMENT_PENDING: "progress",
  COMPLETED: "success",
  FAILED: "failed",
  CANCELLED: "neutral",
  BLOCKED: "attention",
};

const STATE_LABELS_EN: Record<TransferProgressState, string> = {
  CREATED: "Transfer created", ACCOUNT_VALIDATED: "Account verified", FUNDS_VALIDATED: "Funds verified",
  SECURITY_CONFIRMED: "Security confirmation completed", COMPLIANCE_CHECK: "Regulatory checks in progress",
  DOCUMENT_REQUIRED: "Document required", DOCUMENT_REVIEW: "Document under review", FINAL_REVIEW: "Final bank review",
  APPROVED: "Transfer approved", SETTLEMENT_PENDING: "Final confirmation pending", COMPLETED: "Transfer completed",
  FAILED: "Transfer not completed", CANCELLED: "Transfer cancelled", BLOCKED: "Transfer suspended",
};
export function progressStateLabel(state: TransferProgressState, language: "fr" | "en" = "fr"): string {
  return language === "en" ? STATE_LABELS_EN[state] : STATE_LABELS[state];
}

/** 99 % must never look like a success (§66). */
export function progressTone(transfer: {
  status: TransferStatus;
  progressState: TransferProgressState;
  progressPercent: number;
}): ProgressTone {
  if (transfer.status === "COMPLETED" && transfer.progressPercent === 100) return "success";
  return STATE_TONES[transfer.progressState] ?? "progress";
}

/** Explains, in plain language, why the transfer is not at 100 % yet (§67, §68). */
export function progressExplanation(
  transfer: Pick<TransferDto, "status" | "kind" | "progressState" | "progressPercent">,
  openRequirement?: TransferRequirementDto | undefined,
  language: "fr" | "en" = "fr",
): string {
  if (transfer.status === "COMPLETED" && transfer.progressPercent === 100) {
    return language === "en"
      ? transfer.kind === "INTERNAL_TRANSFER" ? "The recipient account has been credited. The transfer is complete." : "The simulated external transfer workflow is complete."
      : transfer.kind === "INTERNAL_TRANSFER" ? "Le compte du bénéficiaire a été crédité. Le virement est terminé." : "Le parcours de simulation du transfert externe est terminé.";
  }

  switch (transfer.status) {
    case "READY_FOR_CONFIRMATION":
      return "Ce virement attend votre confirmation.";
    case "DOCUMENT_REQUIRED":
      return openRequirement
        ? `Action requise : transmettez « ${openRequirement.title} » pour poursuivre ce virement.`
        : "Action requise : un justificatif est nécessaire pour poursuivre ce virement.";
    case "COMPLIANCE_REVIEW":
      return "Tout ce qui vous concerne est fait. Nos équipes finalisent les vérifications réglementaires.";
    case "APPROVED":
      return "Le transfert est approuvé à 95 % et attend sa mise en file finale par nos équipes.";
    case "SETTLEMENT_PENDING":
      return "Le transfert simulé est à 99 %. Il attend la décision administrative finale.";
    case "BLOCKED":
      return "Ce virement est suspendu. Nos équipes vous contactent avant toute suite ; les fonds restent réservés.";
    case "REJECTED":
      return "Ce virement n'a pas été autorisé. Les fonds réservés ont été rendus disponibles.";
    case "FAILED":
      return "Ce virement n'a pas abouti. Aucun montant définitif n'a été prélevé.";
    case "CANCELLED":
      return "Ce virement a été annulé avant exécution.";
    default:
      return "Le virement est en cours de traitement.";
  }
}

/** Screen-reader sentence: progress is never communicated visually only (§91). */
export function progressAnnouncement(transfer: {
  progressPercent: number;
  progressState: TransferProgressState;
  language?: "fr" | "en";
}): string {
  const language = transfer.language ?? "fr";
  return language === "en"
    ? `Transfer progress, ${transfer.progressPercent} percent, ${progressStateLabel(transfer.progressState, "en").toLowerCase()}.`
    : `Progression du virement, ${transfer.progressPercent} pour cent, ${progressStateLabel(transfer.progressState, "fr").toLowerCase()}.`;
}

const REQUIREMENT_STATUS_LABELS: Record<TransferRequirementStatus, string> = {
  REQUIRED: "À fournir",
  SUBMITTED: "Transmis",
  UNDER_REVIEW: "En cours d'examen",
  SATISFIED: "Accepté",
  REPLACEMENT_REQUIRED: "À remplacer",
  WAIVED: "Non nécessaire",
  EXPIRED: "Expiré",
};

const REQUIREMENT_STATUS_LABELS_EN: Record<TransferRequirementStatus, string> = {
  REQUIRED: "Required", SUBMITTED: "Submitted", UNDER_REVIEW: "Under review", SATISFIED: "Accepted",
  REPLACEMENT_REQUIRED: "Replacement required", WAIVED: "Not required", EXPIRED: "Expired",
};
export function requirementStatusLabel(status: TransferRequirementStatus, language: "fr" | "en" = "fr"): string {
  return language === "en" ? REQUIREMENT_STATUS_LABELS_EN[status] : REQUIREMENT_STATUS_LABELS[status];
}

const REJECTION_MESSAGES: Record<string, string> = {
  UNREADABLE: "Le document n'était pas lisible.",
  EXPIRED: "Le document fourni est expiré.",
  WRONG_TYPE: "Le document fourni ne correspond pas au justificatif demandé.",
  INCOMPLETE: "Le document fourni était incomplet.",
};

/** Customer-safe reason only: internal review notes are never exposed (§37). */
const REJECTION_MESSAGES_EN: Record<string, string> = {
  UNREADABLE: "The document could not be read.", EXPIRED: "The document provided has expired.",
  WRONG_TYPE: "The document provided does not match the requested supporting document.",
  INCOMPLETE: "The document provided was incomplete.",
};
export function rejectionMessage(code: string | null, language: "fr" | "en" = "fr"): string | null {
  if (!code) return null;
  return language === "en" ? REJECTION_MESSAGES_EN[code] ?? "The document could not be accepted." : REJECTION_MESSAGES[code] ?? "Le document fourni n'a pas pu être accepté.";
}

export function openRequirement(
  requirements: TransferRequirementDto[],
): TransferRequirementDto | undefined {
  return requirements.find(
    (item) => item.status === "REQUIRED" || item.status === "REPLACEMENT_REQUIRED",
  );
}

/** Milestone ticks shown under the bar; purely presentational. */
export const PROGRESS_MILESTONES: readonly number[] = [0, 30, 60, 90, 95, 99, 100];
