import type { StatusTone } from "@/components/ui/status-badge";
import { formatMoneyFromMinor } from "@/lib/format/currency";

import type {
  CustomerTransactionStatus,
  TransactionDirection,
} from "@/features/transactions/types/transaction";

/**
 * Customer vocabulary (§79, §97, §163). Internal accounting terms such as
 * "liability", "journal" or "credit side" never reach the interface.
 */

const STATUS_LABELS: Record<CustomerTransactionStatus, string> = {
  PENDING: "En attente",
  PROCESSING: "En cours",
  COMPLETED: "Terminé",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  REVERSED: "Contre-passé",
};

const STATUS_TONES: Record<CustomerTransactionStatus, StatusTone> = {
  PENDING: "pending",
  PROCESSING: "pending",
  COMPLETED: "success",
  FAILED: "failed",
  CANCELLED: "neutral",
  REVERSED: "info",
};

const TYPE_LABELS: Record<string, string> = {
  TRANSFER: "Virement",
  FUNDING: "Alimentation du compte",
  FEE: "Frais",
  REFUND: "Remboursement",
  ADJUSTMENT: "Régularisation",
  REVERSAL: "Contre-passation",
  ACCOUNT_OPENING: "Ouverture de compte",
};

export function transactionStatusLabel(status: CustomerTransactionStatus): string {
  return STATUS_LABELS[status];
}

export function transactionStatusTone(status: CustomerTransactionStatus): StatusTone {
  return STATUS_TONES[status];
}

export function transactionTypeLabel(type: string, direction: TransactionDirection): string {
  if (type === "TRANSFER") {
    return direction === "INCOMING" ? "Virement reçu" : "Virement émis";
  }
  return TYPE_LABELS[type] ?? "Opération";
}

export function directionLabel(direction: TransactionDirection): string {
  switch (direction) {
    case "INCOMING":
      return "Entrée d'argent";
    case "OUTGOING":
      return "Sortie d'argent";
    default:
      return "Opération";
  }
}

/** Presentation-only conversion of server minor units (§30). */
export function formatTransactionAmount(
  amountMinor: number,
  currency: string,
  minorUnit: number,
  direction: TransactionDirection,
): string {
  const signed = direction === "OUTGOING" ? -amountMinor : amountMinor;
  return formatMoneyFromMinor(signed, {
    currency,
    minorUnitScale: 10 ** minorUnit,
    signDisplay: direction === "NEUTRAL" ? "auto" : "always",
  });
}

/** Screen-reader label: direction is spoken, not only coloured (§165, §166). */
export function transactionAmountAriaLabel(
  amountMinor: number,
  currency: string,
  minorUnit: number,
  direction: TransactionDirection,
): string {
  const amount = formatMoneyFromMinor(amountMinor, {
    currency,
    minorUnitScale: 10 ** minorUnit,
  });
  return `${directionLabel(direction)}, ${amount}`;
}

/** Decimal value for presentation primitives that expect major units. */
export function toMajorUnits(amountMinor: number, minorUnit: number): number {
  return amountMinor / 10 ** minorUnit;
}
