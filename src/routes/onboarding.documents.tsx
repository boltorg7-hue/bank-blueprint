import { useLanguage } from "@/components/providers/LanguageProvider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { DocumentUploader } from "@/features/onboarding/components/DocumentUploader";
import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import {
  hasIdentityDocument,
  hasProofOfAddress,
  isSubmitted,
} from "@/features/onboarding/lib/tasks";

export const Route = createFileRoute("/onboarding/documents")({
  head: () => ({
    meta: [
      { title: "Vérification d’identité — Ouverture de compte RFC" },
      { name: "description", content: "Transmettez vos justificatifs dans l’espace sécurisé RFC." },
      { property: "og:title", content: "Vérification d’identité — RFC FINANCE Bank" },
      {
        property: "og:description",
        content: "Troisième étape sécurisée de l’ouverture de compte RFC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DocumentsStepPage,
});

function DocumentsStepPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const { data: context, isPending } = useCustomerContext();

  if (isPending || !context) {
    return (
      <OnboardingShell
        stepId="documents"
        title={en ? "Verify your identity" : "Vérification de votre identité"}
      >
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">{en ? "Loading…" : "Chargement…"}</span>
        </div>
      </OnboardingShell>
    );
  }

  const editable = !isSubmitted(context);
  const ready = hasIdentityDocument(context) && hasProofOfAddress(context);
  const canDefer = editable && context.profile.lifecycle_state !== "ADDITIONAL_DOCUMENT_REQUIRED";

  return (
    <OnboardingShell
      stepId="documents"
      title={en ? "Verify your identity" : "Vérification de votre identité"}
      description={
        en
          ? "You can upload your documents now or continue and provide them later."
          : "Vous pouvez transmettre vos justificatifs maintenant ou poursuivre votre inscription et les fournir plus tard."
      }
      why={
        en
          ? "Identity verification is required before banking access. Skipping this step does not verify your identity or activate an account."
          : "La vérification d'identité reste obligatoire avant tout accès bancaire. Passer cette étape ne valide pas votre identité et n'active aucun compte."
      }
    >
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-start gap-3 border-b border-border bg-surface/70 p-4 sm:p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <FileCheck2 className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-label font-semibold text-foreground">
              {en ? "Documents to provide" : "Justificatifs à transmettre"}
            </h2>
            <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
              {en
                ? "Add a valid identity document and a recent proof of address. You can track each document review status below."
                : "Ajoutez une pièce d’identité valide et un justificatif de domicile récent. Vous pourrez suivre ci-dessous le statut de vérification de chaque document."}
            </p>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <DocumentUploader context={context} editable={editable} />
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
        <p className="text-body-sm leading-relaxed text-muted-foreground">
          {en
            ? "Your files are handled through a private, access-controlled area. Only authorized verification workflows can review them."
            : "Vos fichiers sont traités dans un espace privé à accès contrôlé. Seuls les processus de vérification autorisés peuvent les consulter."}
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {ready ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success-muted px-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <CheckCircle2
              className="mt-0.5 size-6 shrink-0 text-success animate-in zoom-in-50 duration-700"
              aria-hidden="true"
            />
            <div>
              <p className="text-label text-foreground">
                {en ? "Step 3 of 4 completed" : "Étape 3 sur 4 terminée"}
              </p>
              <p className="text-body-sm text-muted-foreground">
                {en
                  ? "Your identity documents are provided. One last check and you're done."
                  : "Vos documents d'identité sont bien renseignés. Une dernière relecture et c'est terminé."}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-body-sm text-muted-foreground">
            {en
              ? "You can add an identity document and proof of address now, or continue without them for the moment."
              : "Vous pouvez ajouter une pièce d'identité et un justificatif de domicile maintenant, ou continuer sans les fournir pour le moment."}
          </p>
        )}
        {ready || !editable ? (
          <Button asChild className="w-full touch-target">
            <Link to={editable ? "/onboarding/review" : "/onboarding/status"}>
              {en ? "Continue to review" : "Continuer vers la relecture"}
            </Link>
          </Button>
        ) : null}
        {!ready && canDefer ? (
          <Button asChild variant="outline" className="w-full touch-target">
            <Link to="/onboarding/review">
              {en
                ? "Continue without documents for now"
                : "Continuer sans fournir les documents pour le moment"}
            </Link>
          </Button>
        ) : null}
        {!ready && editable && !canDefer ? (
          <Button className="w-full touch-target" disabled>
            {en
              ? "The requested documents are required"
              : "Les documents demandés sont obligatoires"}
          </Button>
        ) : null}
      </div>
    </OnboardingShell>
  );
}
