/**
 * Client-safe shapes returned by the onboarding server functions.
 * Authentication, profile, identity verification and banking status stay
 * separate concepts (§1).
 */
import type { CustomerLifecycleState, OnboardingStep } from "@/types/customer-lifecycle";

export type IdentityVerificationStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export type VerificationDocumentStatus =
  | "UPLOADED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "ACTION_REQUIRED"
  | "EXPIRED"
  | "REJECTED";

export type VerificationDocumentType =
  | "IDENTITY_CARD"
  | "PASSPORT"
  | "RESIDENCE_PERMIT"
  | "PROOF_OF_ADDRESS"
  | "ADDITIONAL_DOCUMENT";

export type CustomerProfile = {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  country_of_residence: string | null;
  occupation: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  lifecycle_state: CustomerLifecycleState;
  onboarding_step: OnboardingStep;
};

export type CustomerAddress = {
  id: string;
  country: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  region: string | null;
  postal_code: string | null;
};

export type IdentityVerification = {
  id: string;
  status: IdentityVerificationStatus;
  submitted_at: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  requested_information: string | null;
};

export type VerificationDocument = {
  id: string;
  document_type: VerificationDocumentType;
  original_filename: string | null;
  status: VerificationDocumentStatus;
  rejection_reason: string | null;
  created_at: string;
};

export type CustomerContext = {
  email: string | null;
  emailVerified: boolean;
  profile: CustomerProfile;
  address: CustomerAddress | null;
  verification: IdentityVerification;
  documents: VerificationDocument[];
};

export const VERIFICATION_STATUS_LABELS: Record<IdentityVerificationStatus, string> = {
  NOT_STARTED: "Non commencée",
  IN_PROGRESS: "En préparation",
  SUBMITTED: "Envoyée",
  UNDER_REVIEW: "En cours de vérification",
  ADDITIONAL_INFORMATION_REQUIRED: "Document complémentaire demandé",
  VERIFIED: "Identité vérifiée",
  REJECTED: "Vérification refusée",
  EXPIRED: "Vérification expirée",
};

export const DOCUMENT_STATUS_LABELS: Record<VerificationDocumentStatus, string> = {
  UPLOADED: "Envoyé",
  UNDER_REVIEW: "En cours de vérification",
  ACCEPTED: "Accepté",
  ACTION_REQUIRED: "Action requise",
  EXPIRED: "Expiré",
  REJECTED: "Refusé",
};
