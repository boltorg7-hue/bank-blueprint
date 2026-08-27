/**
 * Onboarding task model (§63).
 * Progression is derived from trusted server state, never from component
 * conditions or browser storage.
 */
import type { CustomerContext } from "@/features/onboarding/types/customer-context";
import type { AppPath } from "@/lib/routing";

export type OnboardingTaskStatus = "done" | "current" | "todo" | "blocked";

export type OnboardingTask = {
  id: string;
  title: string;
  description: string;
  status: OnboardingTaskStatus;
  required: boolean;
  route: AppPath;
};

export const ONBOARDING_FLOW: { id: string; label: string; route: AppPath }[] = [
  { id: "profile", label: "Informations", route: "/onboarding/profile" },
  { id: "address", label: "Adresse", route: "/onboarding/address" },
  { id: "documents", label: "Identité", route: "/onboarding/documents" },
  { id: "review", label: "Vérification", route: "/onboarding/review" },
];

export function isProfileComplete(context: CustomerContext): boolean {
  const profile = context.profile;
  return Boolean(
    profile.first_name &&
      profile.last_name &&
      profile.date_of_birth &&
      profile.nationality &&
      profile.country_of_residence &&
      profile.occupation,
  );
}

export function hasIdentityDocument(context: CustomerContext): boolean {
  return context.documents.some((document) =>
    ["IDENTITY_CARD", "PASSPORT", "RESIDENCE_PERMIT"].includes(document.document_type),
  );
}

export function hasProofOfAddress(context: CustomerContext): boolean {
  return context.documents.some((document) => document.document_type === "PROOF_OF_ADDRESS");
}

export function isSubmitted(context: CustomerContext): boolean {
  return ["SUBMITTED", "UNDER_REVIEW", "VERIFIED"].includes(context.verification.status);
}

export function buildOnboardingTasks(context: CustomerContext): OnboardingTask[] {
  const emailDone = context.emailVerified;
  const profileDone = isProfileComplete(context);
  const addressDone = Boolean(context.address);
  const documentsDone = hasIdentityDocument(context) && hasProofOfAddress(context);
  const submitted = isSubmitted(context);

  const tasks: OnboardingTask[] = [
    {
      id: "email",
      title: "Adresse e-mail confirmée",
      description: emailDone
        ? "Votre adresse e-mail est confirmée."
        : "Confirmez votre adresse e-mail pour sécuriser votre compte.",
      status: emailDone ? "done" : "current",
      required: true,
      route: "/verify-email",
    },
    {
      id: "profile",
      title: "Informations personnelles",
      description: "Nom, date de naissance, nationalité, pays de résidence et profession.",
      status: profileDone ? "done" : emailDone ? "current" : "todo",
      required: true,
      route: "/onboarding/profile",
    },
    {
      id: "address",
      title: "Adresse de résidence",
      description: "Adresse complète, adaptée au format de votre pays.",
      status: addressDone ? "done" : profileDone ? "current" : "todo",
      required: true,
      route: "/onboarding/address",
    },
    {
      id: "documents",
      title: "Vérification d'identité",
      description: "Une pièce d'identité et un justificatif de domicile.",
      status: documentsDone ? "done" : addressDone ? "current" : "todo",
      required: true,
      route: "/onboarding/documents",
    },
    {
      id: "review",
      title: "Envoi du dossier",
      description: "Relisez vos informations, puis envoyez votre dossier pour vérification.",
      status: submitted ? "done" : documentsDone ? "current" : "todo",
      required: true,
      route: "/onboarding/review",
    },
    {
      id: "activation",
      title: "Ouverture du compte",
      description:
        "Après la vérification d'identité, l'ouverture du compte fait l'objet d'un examen distinct.",
      status: context.profile.lifecycle_state === "ACTIVE" ? "done" : submitted ? "current" : "todo",
      required: true,
      route: "/onboarding/status",
    },
  ];

  return tasks;
}

/** Next incomplete step, used to resume onboarding where the customer left off (§29). */
export function nextOnboardingRoute(context: CustomerContext): AppPath {
  if (isSubmitted(context)) return "/onboarding/status";
  if (!isProfileComplete(context)) return "/onboarding/profile";
  if (!context.address) return "/onboarding/address";
  if (!hasIdentityDocument(context) || !hasProofOfAddress(context)) return "/onboarding/documents";
  return "/onboarding/review";
}
