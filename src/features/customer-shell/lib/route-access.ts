/**
 * Centralised customer route-access matrix (§71 – §74).
 *
 * The client uses this only to shape the UI. Every privileged read/write is
 * still authorised server-side (RLS + server functions); nothing here grants
 * access on its own.
 */
import type { CustomerLifecycleState } from "@/types/customer-lifecycle";

export type AccessCategory =
  /** Any authenticated customer, even mid-onboarding. */
  | "authenticated"
  /** Customer may consult banking information (view-only is enough). */
  | "banking-read"
  /** Customer may initiate money movement or manage beneficiaries. */
  | "transactional";

/** States allowed to enter the authenticated banking shell at all. */
const SHELL_STATES: readonly CustomerLifecycleState[] = [
  "ACTIVE",
  "RESTRICTED",
  "SUSPENDED",
];

export function canEnterBankingShell(state: CustomerLifecycleState): boolean {
  return SHELL_STATES.includes(state);
}

/** Read access to account information, statements, documents and messages. */
export function canReadBanking(state: CustomerLifecycleState): boolean {
  return canEnterBankingShell(state);
}

/** Money movement requires a fully active banking status — never verified-only. */
export function canTransact(state: CustomerLifecycleState): boolean {
  return state === "ACTIVE";
}

export function isAllowed(
  state: CustomerLifecycleState,
  category: AccessCategory,
): boolean {
  switch (category) {
    case "authenticated":
      return true;
    case "banking-read":
      return canReadBanking(state);
    case "transactional":
      return canTransact(state);
  }
}

/** Customer-facing explanation when a transactional action is unavailable. */
export function transactionalBlockedReason(
  state: CustomerLifecycleState,
): string | null {
  if (canTransact(state)) return null;
  if (state === "RESTRICTED") {
    return "Les opérations sont temporairement limitées sur votre compte.";
  }
  if (state === "SUSPENDED") {
    return "Votre compte est suspendu : les opérations ne sont pas disponibles.";
  }
  return "Cette action sera disponible dès l'activation complète de votre compte.";
}
