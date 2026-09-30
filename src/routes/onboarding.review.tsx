import { useLanguage } from "@/components/providers/LanguageProvider";
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
  const { language } = useLanguage();
  const en = language === "en";
  const navigate = useNavigate();
  const { data: context, isPending } = useCustomerContext();
  const invalidate = useInvalidateCustomerContext();
  const submit = useServerFn(submitVerification);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (isPending || !context) {
    return (
      <OnboardingShell stepId="review" title={en ? "Review your application" : "Relecture de votre dossier"}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">{en ? "Loading…" : "Chargement…"}</span>
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
      await navigate({ to: "/onboarding/transition" });
    } catch {
      setError((en ? "We could not submit your application. Please try again shortly." : "Nous n'avons pas pu transmettre votre dossier. Réessayez dans un instant."));
    } finally {
      setPending(false);
    }
  }

  return (
    <OnboardingShell
      stepId="review"
      title={en ? "Review your application" : "Relecture de votre dossier"}
      description={en ? "Check your information before submitting. Afterwards, some details can only be changed through a formal request." : "Vérifiez vos informations avant transmission. Après l'envoi, certaines données ne pourront être modifiées que par une demande encadrée."}
      why={en ? "Accurate information helps avoid delays during verification." : "Une information exacte évite un délai supplémentaire lors de la vérification."}
    >
      <div className="space-y-4">
        <Section title={en ? "Personal information" : "Informations personnelles"} editRoute="/onboarding/profile" editable={true}>
          <Row label={en ? "First name" : "Prénom"} value={profile.first_name} />
          <Row label={en ? "Middle name" : "Deuxième prénom"} value={profile.middle_name} />
          <Row label={en ? "Last name" : "Nom"} value={profile.last_name} />
          <Row
            label={en ? "Date of birth" : "Date de naissance"}
            value={profile.date_of_birth ? formatDate(profile.date_of_birth) : null}
          />
          <Row label={en ? "Nationality" : "Nationalité"} value={profile.nationality} />
          <Row label={en ? "Country of residence" : "Pays de résidence"} value={profile.country_of_residence} />
          <Row label={en ? "Occupation" : "Profession"} value={profile.occupation} />
          <Row label={en ? "Phone" : "Téléphone"} value={profile.phone} />
        </Section>

        <Section title={en ? "Address" : "Adresse"} editRoute="/onboarding/address" editable={true}>
          <Row label={en ? "Country" : "Pays"} value={address?.country ?? null} />
          <Row label={en ? "Address" : "Adresse"} value={address?.address_line1 ?? null} />
          <Row label={en ? "Address line 2" : "Complément"} value={address?.address_line2 ?? null} />
          <Row label={en ? "City" : "Ville"} value={address?.city ?? null} />
          <Row label={en ? "Region" : "Région"} value={address?.region ?? null} />
          <Row label={en ? "Postal code" : "Code postal"} value={address?.postal_code ?? null} />
        </Section>

        <Section title={en ? "Documents" : "Documents"} editRoute="/onboarding/documents" editable={true}>
          {context.documents.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">{en ? "No documents added." : "Aucun document ajouté."}</p>
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
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <section className="rounded-xl border border-border bg-surface px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-label text-foreground">{title}</h2>
        {editable ? (
          <Button asChild variant="ghost" size="sm" className="touch-target">
            <Link to={editRoute}>{en ? "Edit" : "Modifier"}</Link>
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
