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

export function progressStateLabel(state: TransferProgressState): string {
  return STATE_LABELS[state];
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
): string {
  if (transfer.status === "COMPLETED" && transfer.progressPercent === 100) {
    return transfer.kind === "INTERNAL_TRANSFER"
      ? "Le compte du bénéficiaire a été crédité. Le virement est terminé."
      : "La banque destinataire a confirmé la réception des fonds. Le virement est terminé.";
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
      return "Le virement est approuvé et va être transmis à la banque destinataire.";
    case "SETTLEMENT_PENDING":
      return "Tout ce qui vous concerne est terminé. Nous attendons la confirmation finale du virement par la banque destinataire.";
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
}): string {
  return `Progression du virement, ${transfer.progressPercent} pour cent, ${progressStateLabel(
    transfer.progressState,
  ).toLowerCase()}.`;
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

export function requirementStatusLabel(status: TransferRequirementStatus): string {
  return REQUIREMENT_STATUS_LABELS[status];
}

const REJECTION_MESSAGES: Record<string, string> = {
  UNREADABLE: "Le document n'était pas lisible.",
  EXPIRED: "Le document fourni est expiré.",
  WRONG_TYPE: "Le document fourni ne correspond pas au justificatif demandé.",
  INCOMPLETE: "Le document fourni était incomplet.",
};

/** Customer-safe reason only: internal review notes are never exposed (§37). */
export function rejectionMessage(code: string | null): string | null {
  if (!code) return null;
  return REJECTION_MESSAGES[code] ?? "Le document fourni n'a pas pu être accepté.";
}

export function openRequirement(
  requirements: TransferRequirementDto[],
): TransferRequirementDto | undefined {
  return requirements.find(
    (item) => item.status === "REQUIRED" || item.status === "REPLACEMENT_REQUIRED",
  );
}

/** Milestone ticks shown under the bar; purely presentational. */
export const PROGRESS_MILESTONES: readonly number[] = [0, 30, 60, 90, 100];
