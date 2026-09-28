import { useLanguage } from "@/components/providers/LanguageProvider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { VERIFICATION_STATUS_LABELS } from "@/features/onboarding/types/customer-context";
import { LIFECYCLE_LABELS } from "@/types/customer-lifecycle";
import { formatDateTime } from "@/lib/format/date";

export const Route = createFileRoute("/onboarding/status")({
  component: OnboardingStatusPage,
});

/** Verification status screen (§55). No promised timeframes are displayed. */
function OnboardingStatusPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const { data: context, isPending } = useCustomerContext();

  if (isPending || !context) {
    return (
      <OnboardingShell title={en ? "Track your application" : "Suivi de votre dossier"}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">{en ? "Loading…" : "Chargement…"}</span>
        </div>
      </OnboardingShell>
    );
  }

  const verification = context.verification;
  const requested = verification?.requested_information ?? null;
  const active = context.profile.lifecycle_state === "ACTIVE";

  return (
    <OnboardingShell
      title={en ? "Track your application" : "Suivi de votre dossier"}
      description={`${en ? "Status" : "Statut"} : ${en ? context.profile.lifecycle_state.replaceAll("_", " ").toLowerCase() : LIFECYCLE_LABELS[context.profile.lifecycle_state]}.`}
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
          <p className="text-body-sm flex items-start gap-2 text-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
            {verification
              ? `${en ? "Identity verification" : "Vérification d’identité"} : ${en ? verification.status.replaceAll("_", " ").toLowerCase() : VERIFICATION_STATUS_LABELS[verification.status]}.`
              : (en ? "Your identity verification has not started yet." : "Votre vérification d'identité n'a pas encore débuté.")}
          </p>
          {verification?.submitted_at ? (
            <p className="text-caption mt-2 text-muted-foreground">
              {en ? "Submitted on" : "Dossier transmis le"} {formatDateTime(verification.submitted_at)}.
            </p>
          ) : null}
        </div>

        {requested ? (
          <div className="rounded-xl border border-warning/30 bg-warning-muted px-4 py-4">
            <p className="text-label text-foreground">{en ? "Additional information requested" : "Information complémentaire demandée"}</p>
            <p className="text-body-sm mt-1 text-foreground">{requested}</p>
            <Button asChild className="mt-4 touch-target">
              <Link to="/onboarding/documents">{en ? "Add the requested document" : "Ajouter le document demandé"}</Link>
            </Button>
          </div>
        ) : (
          <p className="text-body-sm text-muted-foreground">
            {en
              ? "We will let you know when your verification progresses. No action is needed for now."
              : "Nous vous informerons dès que la vérification aura avancé. Aucune action n'est requise de votre part pour le moment."}
          </p>
        )}

        {active ? (
          <Button asChild className="w-full touch-target">
            <Link to="/app/dashboard">{en ? "Go to my account" : "Accéder à mon espace"}</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full touch-target">
            <Link to="/help">{en ? "Visit the help centre" : "Consulter le centre d'aide"}</Link>
          </Button>
        )}
      </div>
    </OnboardingShell>
  );
}
