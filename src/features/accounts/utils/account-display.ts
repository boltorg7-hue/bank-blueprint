import type { StatusTone } from "@/components/ui/status-badge";
import { formatMoneyFromMinor } from "@/lib/format/currency";

import type { AccountStatus, AccountType } from "@/features/accounts/types/account";

/**
 * Presentation helpers for accounts (§12, §34, §79).
 * Raw enum values are never rendered to customers.
 */

const STATUS_LABELS: Record<AccountStatus, string> = {
  PENDING: "En préparation",
  ACTIVE: "Actif",
  RESTRICTED: "Limité",
  SUSPENDED: "Suspendu",
  FROZEN: "Bloqué",
  CLOSING: "En clôture",
  CLOSED: "Clôturé",
};

const STATUS_TONES: Record<AccountStatus, StatusTone> = {
  PENDING: "pending",
  ACTIVE: "success",
  RESTRICTED: "pending",
  SUSPENDED: "failed",
  FROZEN: "failed",
  CLOSING: "info",
  CLOSED: "neutral",
};

const TYPE_LABELS: Record<AccountType, string> = {
  CURRENT: "Compte courant",
  SAVINGS: "Compte d'épargne",
};

export function accountStatusLabel(status: AccountStatus): string {
  return STATUS_LABELS[status];
}

export function accountStatusTone(status: AccountStatus): StatusTone {
  return STATUS_TONES[status];
}

export function accountTypeLabel(type: AccountType): string {
  return TYPE_LABELS[type];
}

/** Account-level transaction capability, separate from customer lifecycle (§140). */
export function accountAllowsTransactions(status: AccountStatus): boolean {
  return status === "ACTIVE";
}

/** Customer-facing explanation of a non-transactional account state (§14, §15). */
export function accountRestrictionMessage(status: AccountStatus): string | null {
  switch (status) {
    case "ACTIVE":
      return null;
    case "PENDING":
      return "Votre compte bancaire est en cours de préparation. Les opérations seront disponibles dès son ouverture.";
    case "RESTRICTED":
      return "Votre compte présente actuellement des restrictions d'opération. La consultation reste disponible.";
    case "SUSPENDED":
    case "FROZEN":
      return "Les opérations sont actuellement bloquées sur ce compte. Notre service client peut vous accompagner.";
    case "CLOSING":
      return "Ce compte est en cours de clôture. Les nouvelles opérations ne sont plus acceptées.";
    case "CLOSED":
      return "Ce compte est clôturé. Vous conservez l'accès à son historique et à ses relevés.";
  }
}

/**
 * Formats a server-provided minor-unit amount. This is a display conversion
 * only — never an accounting computation (§22, §23, §81).
 */
export function formatAccountAmount(
  amountMinor: number,
  currency: string,
  minorUnit: number,
  options: { signDisplay?: "auto" | "always" | "exceptZero" } = {},
): string {
  return formatMoneyFromMinor(amountMinor, {
    currency,
    minorUnitScale: 10 ** minorUnit,
    ...(options.signDisplay ? { signDisplay: options.signDisplay } : {}),
  });
}

/** Screen-reader friendly amount, e.g. "1 250,00 $US" (§107). */
export function accountAmountAriaLabel(
  label: string,
  amountMinor: number,
  currency: string,
  minorUnit: number,
): string {
  return `${label} : ${formatAccountAmount(amountMinor, currency, minorUnit)}`;
}
