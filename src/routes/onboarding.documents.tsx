import { useLanguage } from "@/components/providers/LanguageProvider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { DocumentUploader } from "@/features/onboarding/components/DocumentUploader";
import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { hasIdentityDocument, hasProofOfAddress, isSubmitted } from "@/features/onboarding/lib/tasks";

export const Route = createFileRoute("/onboarding/documents")({
  head: () => ({
    meta: [
      { title: "Vérification d’identité — Ouverture de compte RFC" },
      { name: "description", content: "Transmettez vos justificatifs dans l’espace sécurisé RFC." },
      { property: "og:title", content: "Vérification d’identité — RFC FINANCE Bank" },
      { property: "og:description", content: "Troisième étape sécurisée de l’ouverture de compte RFC." },
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
      <OnboardingShell stepId="documents" title={en ? "Verify your identity" : "Vérification de votre identité"}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">{en ? "Loading…" : "Chargement…"}</span>
        </div>
      </OnboardingShell>
    );
  }

  const editable = !isSubmitted(context);
  const ready = hasIdentityDocument(context) && hasProofOfAddress(context);

  return (
    <OnboardingShell
      stepId="documents"
      title={en ? "Verify your identity" : "Vérification de votre identité"}
      description={en ? "Add a valid identity document and recent proof of address." : "Ajoutez une pièce d'identité en cours de validité et un justificatif de domicile récent."}
      why={en ? "Verification is required before opening an account. Your documents are stored privately and accessed only by authorised staff." : "Cette vérification est obligatoire avant l'ouverture d'un compte. Vos documents sont conservés dans un espace privé et consultés uniquement par les équipes habilitées."}
    >
      <DocumentUploader context={context} editable={editable} />

      <div className="mt-8 space-y-3">
        {ready ? (
          <div role="status" className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success-muted px-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success animate-in zoom-in-50 duration-700" aria-hidden="true" />
            <div>
              <p className="text-label text-foreground">{en ? "Step 3 of 4 completed" : "Étape 3 sur 4 terminée"}</p>
              <p className="text-body-sm text-muted-foreground">
                {en ? "Your identity documents are provided. One last check and you're done." : "Vos documents d'identité sont bien renseignés. Une dernière relecture et c'est terminé."}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-body-sm text-muted-foreground">
            {en ? "Required: an identity card, passport or residence permit, and proof of address." : "Documents requis : une pièce d'identité (carte d'identité, passeport ou titre de séjour) et un justificatif de domicile."}
          </p>
        )}
        {ready || !editable ? (
          <Button asChild className="w-full touch-target">
            <Link to={editable ? "/onboarding/review" : "/onboarding/status"}>{en ? "Continue to review" : "Continuer vers la relecture"}</Link>
          </Button>
        ) : (
          <Button className="w-full touch-target" disabled>{en ? "Review my application" : "Relire mon dossier"}</Button>
        )}
      </div>
    </OnboardingShell>
  );
}
