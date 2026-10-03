/**
 * Explicit customer lifecycle & onboarding states.
 *
 * Authentication, profile completeness, identity verification and banking
 * account status are FOUR SEPARATE concepts.
 *
 * The lifecycle is authoritative for customer-facing routing.
 * A customer is allowed to use banking features only when ACTIVE.
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

export type CustomerLifecycleState =
  (typeof CUSTOMER_LIFECYCLE_STATES)[number];

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

/**
 * Customer-facing labels.
 * Technical enum values must never be shown directly to customers.
 */
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

export const LIFECYCLE_LABELS_EN: Record<CustomerLifecycleState, string> = {
  VISITOR: "Visitor",
  REGISTERED: "Account created",
  EMAIL_VERIFICATION_REQUIRED: "Email verification required",
  CONTACT_VERIFICATION_REQUIRED: "Phone verification required",
  PROFILE_INCOMPLETE: "Information to complete",
  IDENTITY_REQUIRED: "Identity verification required",
  IDENTITY_SUBMITTED: "Documents submitted",
  IDENTITY_UNDER_REVIEW: "Verification in progress",
  ADDITIONAL_DOCUMENT_REQUIRED: "Additional document requested",
  IDENTITY_VERIFIED: "Identity verified",
  BANKING_REVIEW: "Account opening under review",
  ACTIVE: "Active account",
  RESTRICTED: "Limited account",
  SUSPENDED: "Suspended account",
  CLOSED: "Closed account",
};

/**
 * Only ACTIVE customers may use transactional banking features.
 */
export function canUseBanking(state: CustomerLifecycleState): boolean {
  return state === "ACTIVE";
}

/**
 * Determines where a customer must be sent after authentication.
 *
 * Important:
 * - pending verification states must NOT enter the normal banking dashboard;
 * - only ACTIVE customers enter the fully operational banking area;
 * - RESTRICTED/SUSPENDED may enter the shell so that the customer can
 *   understand the restriction, but they must not transact.
 */
export function nextRouteForLifecycle(
  state: CustomerLifecycleState,
): string {
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

    case "ADDITIONAL_DOCUMENT_REQUIRED":
    case "IDENTITY_SUBMITTED":
    case "IDENTITY_UNDER_REVIEW":
    case "IDENTITY_VERIFIED":
    case "BANKING_REVIEW":
      return "/onboarding/status";

    case "ACTIVE":
    case "RESTRICTED":
    case "SUSPENDED":
      return "/app/dashboard";

    case "CLOSED":
      return "/onboarding/status";

    default:
      return "/onboarding";
  }
}
