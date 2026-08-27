/**
 * Explicit customer lifecycle & onboarding states.
 *
 * Authentication, profile completeness, identity verification and banking
 * account status are FOUR SEPARATE concepts. Never collapse them into a
 * single `verified` boolean (docs/banking/03 §1).
 */

export const CUSTOMER_LIFECYCLE_STATES = [
  "VISITOR",
  "REGISTERED",
  "EMAIL_VERIFICATION_REQUIRED",
  "CONTACT_VERIFICATION_REQUIRED",
  "PROFILE_INCOMPLETE",
  "IDENTITY_REQUIRED",
  "IDENTITY_SUBMITTED",
  "IDENTITY_UNDER_REVIEW",
  "ADDITIONAL_DOCUMENT_REQUIRED",
  "IDENTITY_VERIFIED",
  "BANKING_REVIEW",
  "ACTIVE",
  "RESTRICTED",
  "SUSPENDED",
  "CLOSED",
] as const;

export type CustomerLifecycleState = (typeof CUSTOMER_LIFECYCLE_STATES)[number];

export const ONBOARDING_STEPS = [
  "NOT_STARTED",
  "CONTACT",
  "PERSONAL_DETAILS",
  "ADDRESS",
  "IDENTITY",
  "DOCUMENTS",
  "REVIEW",
  "COMPLETED",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Customer-facing labels — technical enum values are never shown to users. */
export const LIFECYCLE_LABELS: Record<CustomerLifecycleState, string> = {
  VISITOR: "Visiteur",
  REGISTERED: "Compte créé",
  EMAIL_VERIFICATION_REQUIRED: "Vérification de l'e-mail requise",
  CONTACT_VERIFICATION_REQUIRED: "Vérification du téléphone requise",
  PROFILE_INCOMPLETE: "Informations à compléter",
  IDENTITY_REQUIRED: "Vérification d'identité à effectuer",
  IDENTITY_SUBMITTED: "Documents envoyés",
  IDENTITY_UNDER_REVIEW: "Vérification en cours",
  ADDITIONAL_DOCUMENT_REQUIRED: "Document complémentaire demandé",
  IDENTITY_VERIFIED: "Identité vérifiée",
  BANKING_REVIEW: "Ouverture de compte en cours d'examen",
  ACTIVE: "Compte actif",
  RESTRICTED: "Compte limité",
  SUSPENDED: "Compte suspendu",
  CLOSED: "Compte clôturé",
};

/** Only these states may use banking functionality. */
export function canUseBanking(state: CustomerLifecycleState): boolean {
  return state === "ACTIVE";
}

/** Trusted backend state decides post-login routing — never localStorage. */
export function nextRouteForLifecycle(state: CustomerLifecycleState): string {
  switch (state) {
    case "VISITOR":
      return "/login";
    case "REGISTERED":
    case "EMAIL_VERIFICATION_REQUIRED":
      return "/verify-email";
    case "CONTACT_VERIFICATION_REQUIRED":
      return "/verify-contact";
    case "PROFILE_INCOMPLETE":
    case "IDENTITY_REQUIRED":
      return "/onboarding";
    case "IDENTITY_SUBMITTED":
    case "IDENTITY_UNDER_REVIEW":
    case "ADDITIONAL_DOCUMENT_REQUIRED":
    case "BANKING_REVIEW":
      return "/onboarding/status";
    case "IDENTITY_VERIFIED":
    case "ACTIVE":
      return "/app/dashboard";
    default:
      return "/app/dashboard";
  }
}
