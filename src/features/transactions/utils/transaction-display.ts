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

export function transactionStatusLabel(status: CustomerTransactionStatus, language: "fr" | "en" = "fr"): string {
  return language === "en" ? ({PENDING:"Pending",PROCESSING:"Processing",COMPLETED:"Completed",FAILED:"Failed",CANCELLED:"Cancelled",REVERSED:"Reversed"} as Record<CustomerTransactionStatus,string>)[status] : STATUS_LABELS[status];
}

export function transactionStatusTone(status: CustomerTransactionStatus): StatusTone {
  return STATUS_TONES[status];
}

export function transactionTypeLabel(type: string, direction: TransactionDirection, language: "fr" | "en" = "fr"): string {
  if (type === "TRANSFER") {
    return language === "en" ? (direction === "INCOMING" ? "Incoming transfer" : "Outgoing transfer") : (direction === "INCOMING" ? "Virement reçu" : "Virement émis");
  }
  return language === "en" ? ({TRANSFER:"Transfer",FUNDING:"Account funding",FEE:"Fee",REFUND:"Refund",ADJUSTMENT:"Adjustment",REVERSAL:"Reversal",ACCOUNT_OPENING:"Account opening"} as Record<string,string>)[type] ?? "Transaction" : TYPE_LABELS[type] ?? "Opération";
}

export function directionLabel(direction: TransactionDirection, language: "fr" | "en" = "fr"): string {
  switch (direction) {
    case "INCOMING":
      return language === "en" ? "Incoming funds" : "Entrée d'argent";
    case "OUTGOING":
      return language === "en" ? "Outgoing funds" : "Sortie d'argent";
    default:
      return language === "en" ? "Transaction" : "Opération";
  }
}

/** Presentation-only conversion of server minor units (§30). */
export function formatTransactionAmount(
  amountMinor: number,
  currency: string,
  minorUnit: number,
  direction: TransactionDirection,
  language: "fr" | "en" = "fr",
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
  language: "fr" | "en" = "fr",
): string {
  const amount = formatMoneyFromMinor(amountMinor, {
    currency,
    minorUnitScale: 10 ** minorUnit,
  });
  return `${directionLabel(direction, language)}, ${amount}`;
}

/** Decimal value for presentation primitives that expect major units. */
export function toMajorUnits(amountMinor: number, minorUnit: number): number {
  return amountMinor / 10 ** minorUnit;
}
