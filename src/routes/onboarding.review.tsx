import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { useCustomerContext, useInvalidateCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { submitVerification } from "@/features/onboarding/services/onboarding.functions";
import { isProfileComplete, hasIdentityDocument, hasProofOfAddress, isSubmitted } from "@/features/onboarding/lib/tasks";
import { formatDate } from "@/lib/format/date";

export const Route = createFileRoute("/onboarding/review")({
  component: ReviewStepPage,
});

function ReviewStepPage() {
  const navigate = useNavigate();
  const { data: context, isPending } = useCustomerContext();
  const invalidate = useInvalidateCustomerContext();
  const submit = useServerFn(submitVerification);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (isPending || !context) {
    return (
      <OnboardingShell stepId="review" title="Relecture de votre dossier">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">Chargement…</span>
        </div>
      </OnboardingShell>
    );
  }

  if (isSubmitted(context)) {
    void navigate({ to: "/onboarding/status", replace: true });
  }

  const profile = context.profile;
  const address = context.address;
  const complete =
    isProfileComplete(context) && hasIdentityDocument(context) && hasProofOfAddress(context);

  async function handleSubmit() {
    setError(null);
    setPending(true);
    try {
      await submit({ data: undefined });
      await invalidate();
      await navigate({ to: "/onboarding/status" });
    } catch {
      setError("Nous n'avons pas pu transmettre votre dossier. Réessayez dans un instant.");
    } finally {
      setPending(false);
    }
  }

  return (
    <OnboardingShell
      stepId="review"
      title="Relecture de votre dossier"
      description="Vérifiez vos informations avant transmission. Après l'envoi, certaines données ne pourront être modifiées que par une demande encadrée."
      why="Une information exacte évite un délai supplémentaire lors de la vérification."
    >
      <div className="space-y-4">
        <Section title="Informations personnelles" editRoute="/onboarding/profile" editable={true}>
          <Row label="Prénom" value={profile.first_name} />
          <Row label="Deuxième prénom" value={profile.middle_name} />
          <Row label="Nom" value={profile.last_name} />
          <Row
            label="Date de naissance"
            value={profile.date_of_birth ? formatDate(profile.date_of_birth) : null}
          />
          <Row label="Nationalité" value={profile.nationality} />
          <Row label="Pays de résidence" value={profile.country_of_residence} />
          <Row label="Profession" value={profile.occupation} />
          <Row label="Téléphone" value={profile.phone} />
        </Section>

        <Section title="Adresse" editRoute="/onboarding/address" editable={true}>
          <Row label="Pays" value={address?.country ?? null} />
          <Row label="Adresse" value={address?.address_line1 ?? null} />
          <Row label="Complément" value={address?.address_line2 ?? null} />
          <Row label="Ville" value={address?.city ?? null} />
          <Row label="Région" value={address?.region ?? null} />
          <Row label="Code postal" value={address?.postal_code ?? null} />
        </Section>

        <Section title="Documents" editRoute="/onboarding/documents" editable={true}>
          {context.documents.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">Aucun document ajouté.</p>
          ) : (
            context.documents.map((document) => (
              <Row
                key={document.id}
                label={document.document_type}
                value={document.original_filename ?? "Document"}
              />
            ))
          )}
        </Section>
      </div>

      {error ? (
        <p role="alert" className="text-body-sm mt-6 rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-3">
        {!complete ? (
          <p className="text-body-sm rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-foreground">
            Il manque encore des informations ou des documents obligatoires.
          </p>
        ) : null}
        <Button
          type="button"
          className="w-full touch-target"
          loading={pending}
          disabled={!complete}
          onClick={() => void handleSubmit()}
        >
          Transmettre mon dossier
        </Button>
      </div>
    </OnboardingShell>
  );
}

function Section({
  title,
  editRoute,
  editable,
  children,
}: {
  title: string;
  editRoute: "/onboarding/profile" | "/onboarding/address" | "/onboarding/documents";
  editable: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-label text-foreground">{title}</h2>
        {editable ? (
          <Button asChild variant="ghost" size="sm" className="touch-target">
            <Link to={editRoute}>Modifier</Link>
          </Button>
        ) : null}
      </div>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <dt className="text-body-sm text-muted-foreground">{label}</dt>
      <dd className="text-body-sm text-foreground">{value}</dd>
    </div>
  );
}
