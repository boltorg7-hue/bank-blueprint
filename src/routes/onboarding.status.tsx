import { useLanguage } from "@/components/providers/LanguageProvider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3, FileWarning, LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { VERIFICATION_STATUS_LABELS } from "@/features/onboarding/types/customer-context";
import { LIFECYCLE_LABELS, type CustomerLifecycleState } from "@/types/customer-lifecycle";
import { formatDateTime } from "@/lib/format/date";

export const Route = createFileRoute("/onboarding/status")({
  component: OnboardingStatusPage,
});

type StatusCopy = {
  title: string;
  description: string;
  primaryLabel: string;
  primaryRoute: "/onboarding" | "/onboarding/documents" | "/app/dashboard" | "/help";
  secondaryLabel: string;
};

function statusCopy(state: CustomerLifecycleState, en: boolean): StatusCopy {
  const copy: Record<CustomerLifecycleState, StatusCopy> = {
    VISITOR: {
      title: en ? "Start your application" : "Commencer votre dossier",
      description: en ? "Sign in to begin your secure account opening." : "Connectez-vous pour commencer votre ouverture de compte sécurisée.",
      primaryLabel: en ? "Start my application" : "Commencer mon dossier",
      primaryRoute: "/onboarding",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    REGISTERED: {
      title: en ? "Confirm your email" : "Confirmez votre e-mail",
      description: en ? "Your account is created. Confirm your email address to continue." : "Votre compte est créé. Confirmez votre adresse e-mail pour continuer.",
      primaryLabel: en ? "Continue my application" : "Continuer mon dossier",
      primaryRoute: "/onboarding",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    EMAIL_VERIFICATION_REQUIRED: {
      title: en ? "Confirm your email" : "Confirmez votre e-mail",
      description: en ? "Your email confirmation is still required before you can continue." : "La confirmation de votre e-mail est encore nécessaire avant de poursuivre.",
      primaryLabel: en ? "Continue my application" : "Continuer mon dossier",
      primaryRoute: "/onboarding",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    CONTACT_VERIFICATION_REQUIRED: {
      title: en ? "Verify your phone" : "Vérifiez votre téléphone",
      description: en ? "Confirm your phone number to continue your account opening." : "Confirmez votre numéro de téléphone pour poursuivre votre ouverture de compte.",
      primaryLabel: en ? "Verify my phone" : "Vérifier mon téléphone",
      primaryRoute: "/onboarding",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    PROFILE_INCOMPLETE: {
      title: en ? "Complete your information" : "Complétez vos informations",
      description: en ? "Some required information is still missing from your application." : "Certaines informations obligatoires manquent encore à votre dossier.",
      primaryLabel: en ? "Resume my application" : "Reprendre mon dossier",
      primaryRoute: "/onboarding",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    IDENTITY_REQUIRED: {
      title: en ? "Complete identity verification" : "Terminez la vérification d'identité",
      description: en ? "Your identity documents are still required before your application can be reviewed." : "Vos justificatifs d'identité sont encore nécessaires avant l'examen de votre dossier.",
      primaryLabel: en ? "Complete my documents" : "Compléter mes documents",
      primaryRoute: "/onboarding/documents",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    IDENTITY_SUBMITTED: {
      title: en ? "Your application was received" : "Votre dossier a été reçu",
      description: en ? "Your identity documents have been submitted. No further action is required right now." : "Vos justificatifs d'identité ont été transmis. Aucune action n'est requise pour le moment.",
      primaryLabel: en ? "View my application" : "Voir mon dossier",
      primaryRoute: "/onboarding",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    IDENTITY_UNDER_REVIEW: {
      title: en ? "Identity verification is in progress" : "Vérification d'identité en cours",
      description: en ? "Your submitted information is being reviewed. We will show you here if an action becomes necessary." : "Les informations transmises sont en cours d'examen. Nous vous indiquerons ici si une action devient nécessaire.",
      primaryLabel: en ? "View my application" : "Voir mon dossier",
      primaryRoute: "/onboarding",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    ADDITIONAL_DOCUMENT_REQUIRED: {
      title: en ? "An additional document is needed" : "Un document complémentaire est nécessaire",
      description: en ? "We need one more piece of information before verification can continue." : "Un justificatif ou une information supplémentaire est nécessaire pour poursuivre la vérification.",
      primaryLabel: en ? "Add the requested document" : "Ajouter le document demandé",
      primaryRoute: "/onboarding/documents",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    IDENTITY_VERIFIED: {
      title: en ? "Your identity is verified" : "Votre identité est vérifiée",
      description: en ? "Identity verification is complete. Your account opening is now moving through its final review." : "La vérification d'identité est terminée. L'ouverture de votre compte passe maintenant par son examen final.",
      primaryLabel: en ? "View my application" : "Voir mon dossier",
      primaryRoute: "/onboarding",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    BANKING_REVIEW: {
      title: en ? "Your account opening is under review" : "Ouverture de compte en cours d'examen",
      description: en ? "Your identity has been verified and the banking review is still in progress. Your banking operations remain unavailable until activation." : "Votre identité est vérifiée et l'examen bancaire est toujours en cours. Les opérations bancaires restent indisponibles jusqu'à l'activation.",
      primaryLabel: en ? "View my application" : "Voir mon dossier",
      primaryRoute: "/onboarding",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    ACTIVE: {
      title: en ? "Your account is active" : "Votre compte est actif",
      description: en ? "Your account is fully activated and your banking features are available." : "Votre compte est entièrement activé et vos fonctionnalités bancaires sont disponibles.",
      primaryLabel: en ? "Go to my account" : "Accéder à mon espace",
      primaryRoute: "/app/dashboard",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    RESTRICTED: {
      title: en ? "Your account has limited access" : "Votre compte a un accès limité",
      description: en ? "Some banking operations are temporarily unavailable. Your available services remain visible in your banking area." : "Certaines opérations bancaires sont temporairement indisponibles. Les services encore accessibles restent visibles dans votre espace bancaire.",
      primaryLabel: en ? "Go to my account" : "Accéder à mon espace",
      primaryRoute: "/app/dashboard",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    SUSPENDED: {
      title: en ? "Your account is suspended" : "Votre compte est suspendu",
      description: en ? "Banking operations are unavailable while the suspension applies. Your banking area can show the information available to you." : "Les opérations bancaires sont indisponibles pendant la suspension. Votre espace bancaire peut afficher les informations qui restent accessibles.",
      primaryLabel: en ? "View my account" : "Voir mon espace",
      primaryRoute: "/app/dashboard",
      secondaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
    },
    CLOSED: {
      title: en ? "Your account is closed" : "Votre compte est clôturé",
      description: en ? "This account is no longer active. Contact support if you need information about the closure." : "Ce compte n'est plus actif. Contactez l'assistance si vous avez besoin d'informations sur sa clôture.",
      primaryLabel: en ? "Visit the help centre" : "Consulter le centre d'aide",
      primaryRoute: "/help",
      secondaryLabel: en ? "Return to the public site" : "Retourner au site public",
    },
  };

  return copy[state];
}

function lifecycleStage(state: CustomerLifecycleState): number {
  if (["VISITOR", "REGISTERED", "EMAIL_VERIFICATION_REQUIRED", "CONTACT_VERIFICATION_REQUIRED", "PROFILE_INCOMPLETE", "IDENTITY_REQUIRED"].includes(state)) return 1;
  if (["IDENTITY_SUBMITTED", "IDENTITY_UNDER_REVIEW", "ADDITIONAL_DOCUMENT_REQUIRED"].includes(state)) return 2;
  if (["IDENTITY_VERIFIED", "BANKING_REVIEW"].includes(state)) return 3;
  return 4;
}

/** Lifecycle state screen. State is always re-read from trusted server context. */
function OnboardingStatusPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const { data: context, isPending } = useCustomerContext();

  if (isPending || !context) {
    return (
      <OnboardingShell title={en ? "Track your application" : "Suivi de votre dossier"}>
        <div className="flex items-center gap-3 text-muted-foreground" role="status">
          <Spinner className="size-5" />
          <span className="text-body-sm">{en ? "Loading…" : "Chargement…"}</span>
        </div>
      </OnboardingShell>
    );
  }

  const state = context.profile.lifecycle_state;
  const verification = context.verification;
  const requested = verification?.requested_information ?? null;
  const copy = statusCopy(state, en);
  const currentStage = lifecycleStage(state);
  const active = state === "ACTIVE";
  const terminal = state === "CLOSED";

  return (
    <OnboardingShell title={en ? "Track your application" : "Suivi de votre dossier"} description={copy.description}>
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <div className="flex items-start gap-3">
            {state === "ADDITIONAL_DOCUMENT_REQUIRED" ? (
              <FileWarning className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
            ) : state === "RESTRICTED" || state === "SUSPENDED" ? (
              <LockKeyhole className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
            ) : active ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <p className="text-label text-foreground">{copy.title}</p>
              <p className="text-body-sm mt-1 text-muted-foreground">{en ? LIFECYCLE_LABELS[state].replaceAll("_", " ") : LIFECYCLE_LABELS[state]}</p>
              {verification?.submitted_at ? (
                <p className="text-caption mt-2 text-muted-foreground">
                  {en ? "Submitted on" : "Dossier transmis le"} {formatDateTime(verification.submitted_at)}.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <section aria-labelledby="lifecycle-progress" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="lifecycle-progress" className="text-label text-foreground">{en ? "Application progress" : "Progression du dossier"}</h2>
            <span className="text-caption text-muted-foreground">{en ? `Stage ${currentStage} of 4` : `Étape ${currentStage} sur 4`}</span>
          </div>
          <ol className="grid gap-2 sm:grid-cols-4">
            {(en ? ["Application", "Identity review", "Banking review", "Active"] : ["Dossier", "Vérification d'identité", "Examen bancaire", "Actif"]).map((label, index) => {
              const position = index + 1;
              const done = position < currentStage || (position === currentStage && active);
              const current = position === currentStage && !done;
              return (
                <li key={label} className={`rounded-xl border px-3 py-3 ${done ? "border-success/40 bg-success-muted" : current ? "border-brand/40 bg-brand/5" : "border-border bg-surface"}`}>
                  <p className="text-caption font-medium text-foreground">{done ? "✓ " : ""}{label}</p>
                  {current ? <p className="text-caption mt-1 text-muted-foreground">{en ? "Current stage" : "Étape actuelle"}</p> : null}
                </li>
              );
            })}
          </ol>
        </section>

        {requested && state === "ADDITIONAL_DOCUMENT_REQUIRED" ? (
          <div className="rounded-xl border border-warning/30 bg-warning-muted px-4 py-4">
            <p className="text-label text-foreground">{en ? "What we need from you" : "Ce dont nous avons besoin"}</p>
            <p className="text-body-sm mt-1 text-foreground">{requested}</p>
          </div>
        ) : null}

        {state === "IDENTITY_UNDER_REVIEW" || state === "BANKING_REVIEW" ? (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-4">
            <Clock3 className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-body-sm text-muted-foreground">
              {en ? "No action is required while this review is in progress. Refreshing or signing in again will show the latest server status." : "Aucune action n'est requise pendant cet examen. Après un rafraîchissement ou une nouvelle connexion, le statut serveur le plus récent sera affiché."}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full touch-target sm:flex-1">
            <Link to={copy.primaryRoute}>{copy.primaryLabel}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full touch-target sm:flex-1">
            <Link to="/help">{copy.secondaryLabel}</Link>
          </Button>
        </div>

        {terminal ? (
          <p className="text-caption text-muted-foreground">
            {en ? "This status is terminal. If you need information about the closure, contact support." : "Cet état est terminal. Pour toute information sur la clôture, contactez l'assistance."}
          </p>
        ) : null}
      </div>
    </OnboardingShell>
  );
}
