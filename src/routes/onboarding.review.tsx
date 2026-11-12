import { useLanguage } from "@/components/providers/LanguageProvider";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ClipboardCheck, FileText, MapPin, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import {
  useCustomerContext,
  useInvalidateCustomerContext,
} from "@/features/onboarding/hooks/useCustomerContext";
import { submitVerification } from "@/features/onboarding/services/onboarding.functions";
import {
  isProfileComplete,
  hasIdentityDocument,
  hasProofOfAddress,
  isSubmitted,
} from "@/features/onboarding/lib/tasks";
import { formatDate } from "@/lib/format/date";

export const Route = createFileRoute("/onboarding/review")({
  head: () => ({
    meta: [
      { title: "Relecture du dossier — Ouverture de compte RFC" },
      {
        name: "description",
        content: "Relisez et transmettez votre dossier d’ouverture de compte RFC.",
      },
      { property: "og:title", content: "Relecture du dossier — RFC FINANCE Bank" },
      {
        property: "og:description",
        content: "Dernière étape sécurisée avant l’examen du dossier RFC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
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
  const submitted = context ? isSubmitted(context) : false;

  useEffect(() => {
    if (!submitted) return;
    void navigate({ to: "/onboarding/status", replace: true });
  }, [navigate, submitted]);

  if (isPending || !context) {
    return (
      <OnboardingShell
        stepId="review"
        title={en ? "Review your application" : "Relecture de votre dossier"}
      >
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">{en ? "Loading…" : "Chargement…"}</span>
        </div>
      </OnboardingShell>
    );
  }

  const profile = context.profile;
  const address = context.address;
  const documentsProvided = hasIdentityDocument(context) && hasProofOfAddress(context);
  const complete = isProfileComplete(context) && Boolean(address);

  async function handleSubmit() {
    setError(null);
    setPending(true);
    try {
      await submit({ data: undefined });
      await invalidate();
      await navigate({
        to: "/onboarding/transition",
        replace: true,
      });
    } catch {
      setError(
        en
          ? "We could not submit your application. Please try again shortly."
          : "Nous n'avons pas pu transmettre votre dossier. Réessayez dans un instant.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <OnboardingShell
      stepId="review"
      title={en ? "Review your application" : "Relecture de votre dossier"}
      description={
        en
          ? "Check your information before submitting. Afterwards, some details can only be changed through a formal request."
          : "Vérifiez vos informations avant transmission. Après l'envoi, certaines données ne pourront être modifiées que par une demande encadrée."
      }
      why={
        en
          ? "Accurate information helps avoid delays during verification."
          : "Une information exacte évite un délai supplémentaire lors de la vérification."
      }
    >
      <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4 sm:p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <ClipboardCheck className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-label font-semibold text-foreground">
            {en ? "Final application check" : "Dernière vérification du dossier"}
          </h2>
          <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
            {en
              ? "Review each section and use Edit to correct any information before sending your application."
              : "Relisez chaque rubrique et utilisez Modifier pour corriger une information avant de transmettre votre dossier."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Section
          title={en ? "Personal information" : "Informations personnelles"}
          editRoute="/onboarding/profile"
          editable={true}
          icon={UserRound}
        >
          <Row label={en ? "First name" : "Prénom"} value={profile.first_name} />
          <Row label={en ? "Middle name" : "Deuxième prénom"} value={profile.middle_name} />
          <Row label={en ? "Last name" : "Nom"} value={profile.last_name} />
          <Row
            label={en ? "Date of birth" : "Date de naissance"}
            value={profile.date_of_birth ? formatDate(profile.date_of_birth) : null}
          />
          <Row label={en ? "Nationality" : "Nationalité"} value={profile.nationality} />
          <Row
            label={en ? "Country of residence" : "Pays de résidence"}
            value={profile.country_of_residence}
          />
          <Row label={en ? "Occupation" : "Profession"} value={profile.occupation} />
          <Row label={en ? "Phone" : "Téléphone"} value={profile.phone} />
        </Section>

        <Section
          title={en ? "Address" : "Adresse"}
          editRoute="/onboarding/address"
          editable={true}
          icon={MapPin}
        >
          <Row label={en ? "Country" : "Pays"} value={address?.country ?? null} />
          <Row label={en ? "Address" : "Adresse"} value={address?.address_line1 ?? null} />
          <Row
            label={en ? "Address line 2" : "Complément"}
            value={address?.address_line2 ?? null}
          />
          <Row label={en ? "City" : "Ville"} value={address?.city ?? null} />
          <Row label={en ? "Region" : "Région"} value={address?.region ?? null} />
          <Row label={en ? "Postal code" : "Code postal"} value={address?.postal_code ?? null} />
        </Section>

        <Section
          title={en ? "Documents" : "Documents"}
          editRoute="/onboarding/documents"
          editable={true}
          icon={FileText}
        >
          {context.documents.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">
              {en ? "No documents added." : "Aucun document ajouté."}
            </p>
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
        <p
          role="alert"
          className="text-body-sm mt-6 rounded-lg bg-destructive/10 px-3 py-2 text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-3">
        {!complete ? (
          <p className="text-body-sm rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-foreground">
            {en
              ? "Required profile information or your residential address is missing. Use the Edit buttons above to complete them."
              : "Des informations personnelles ou votre adresse de résidence manquent encore. Utilisez les boutons Modifier ci-dessus pour les compléter."}
          </p>
        ) : null}
        {complete && !documentsProvided ? (
          <p className="text-body-sm rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-foreground">
            {en
              ? "You can finish registration now and provide your identity documents later. Identity verification and banking access will remain unavailable until the required documents are reviewed."
              : "Vous pouvez terminer votre inscription maintenant et transmettre vos justificatifs plus tard. La vérification d'identité et l'accès bancaire resteront indisponibles jusqu'à l'examen des documents requis."}
          </p>
        ) : null}
        <Button
          type="button"
          className="w-full touch-target"
          loading={pending}
          disabled={!complete}
          onClick={() => void handleSubmit()}
        >
          {documentsProvided
            ? en
              ? "Submit my application for verification"
              : "Transmettre mon dossier pour vérification"
            : en
              ? "Finish my registration"
              : "Terminer mon inscription"}
        </Button>
      </div>
    </OnboardingShell>
  );
}

function Section({
  title,
  editRoute,
  editable,
  icon: Icon,
  children,
}: {
  title: string;
  editRoute: "/onboarding/profile" | "/onboarding/address" | "/onboarding/documents";
  editable: boolean;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-brand">
            <Icon className="size-4" aria-hidden="true" />
          </div>
          <h2 className="text-label font-semibold text-foreground">{title}</h2>
        </div>
        {editable ? (
          <Button asChild variant="ghost" size="sm" className="touch-target">
            <Link to={editRoute}>{en ? "Edit" : "Modifier"}</Link>
          </Button>
        ) : null}
      </div>
      <dl className="space-y-3 divide-y divide-border/70 [&>div]:pt-3 [&>div:first-child]:pt-0">
        {children}
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-body-sm text-muted-foreground">{label}</dt>
      <dd className="break-words text-body-sm font-medium text-foreground sm:text-right">
        {value}
      </dd>
    </div>
  );
}
