import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { DocumentUploader } from "@/features/onboarding/components/DocumentUploader";
import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { hasIdentityDocument, hasProofOfAddress, isSubmitted } from "@/features/onboarding/lib/tasks";

export const Route = createFileRoute("/onboarding/documents")({
  component: DocumentsStepPage,
});

function DocumentsStepPage() {
  const { data: context, isPending } = useCustomerContext();

  if (isPending || !context) {
    return (
      <OnboardingShell stepId="documents" title="Vérification de votre identité">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">Chargement…</span>
        </div>
      </OnboardingShell>
    );
  }

  const editable = !isSubmitted(context);
  const ready = hasIdentityDocument(context) && hasProofOfAddress(context);

  return (
    <OnboardingShell
      stepId="documents"
      title="Vérification de votre identité"
      description="Ajoutez une pièce d'identité en cours de validité et un justificatif de domicile récent."
      why="Cette vérification est obligatoire avant l'ouverture d'un compte. Vos documents sont conservés dans un espace privé et consultés uniquement par les équipes habilitées."
    >
      <DocumentUploader context={context} editable={editable} />

      <div className="mt-8 space-y-3">
        <p className="text-body-sm text-muted-foreground">
          {ready
            ? "Les documents requis sont présents. Vous pouvez passer à la relecture de votre dossier."
            : "Documents requis : une pièce d'identité (carte d'identité, passeport ou titre de séjour) et un justificatif de domicile."}
        </p>
        <Button asChild className="w-full touch-target" disabled={!ready}>
          <Link to="/onboarding/review">Relire mon dossier</Link>
        </Button>
      </div>
    </OnboardingShell>
  );
}
