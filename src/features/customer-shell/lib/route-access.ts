/**
 * Centralised customer route-access matrix.
 * Client checks shape UI only; server/RLS remains authoritative.
 */
import type { CustomerLifecycleState } from "@/types/customer-lifecycle";

export type AccessCategory = "authenticated" | "banking-read" | "transactional";

const PENDING_STATES: readonly CustomerLifecycleState[] = [
  "IDENTITY_SUBMITTED", "IDENTITY_UNDER_REVIEW", "ADDITIONAL_DOCUMENT_REQUIRED",
  "IDENTITY_VERIFIED", "BANKING_REVIEW",
];
const BANKING_READ_STATES: readonly CustomerLifecycleState[] = [
  "ACTIVE", "RESTRICTED", "SUSPENDED", ...PENDING_STATES,
];
const DASHBOARD_STATES: readonly CustomerLifecycleState[] = [
  ...BANKING_READ_STATES, "PROFILE_INCOMPLETE", "CONTACT_VERIFICATION_REQUIRED", "IDENTITY_REQUIRED",
];

export function isPendingVerification(state: CustomerLifecycleState): boolean {
  return PENDING_STATES.includes(state);
}
export function canEnterBankingShell(state: CustomerLifecycleState): boolean {
  return DASHBOARD_STATES.includes(state);
}
export function canReadBanking(state: CustomerLifecycleState): boolean {
  return BANKING_READ_STATES.includes(state);
}
export function canTransact(state: CustomerLifecycleState): boolean {
  return state === "ACTIVE";
}
export function isAllowed(state: CustomerLifecycleState, category: AccessCategory): boolean {
  switch (category) {
    case "authenticated": return true;
    case "banking-read": return canReadBanking(state);
    case "transactional": return canTransact(state);
  }
}
export function transactionalBlockedReason(state: CustomerLifecycleState): string | null {
  if (canTransact(state)) return null;
  if (state === "RESTRICTED") return "Les opérations sont temporairement limitées sur votre compte.";
  if (state === "SUSPENDED") return "Votre compte est suspendu : les opérations ne sont pas disponibles.";
  return "Cette action sera disponible dès l'activation complète de votre compte.";
}
