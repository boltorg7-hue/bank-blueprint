import { useLanguage } from "@/components/providers/LanguageProvider";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { useCustomerContext, useInvalidateCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { profileStepSchema } from "@/features/onboarding/schemas/onboarding.schemas";
import { fieldErrorsFrom } from "@/features/auth/schemas/auth.schemas";
import { ChoiceField } from "@/features/onboarding/components/ChoiceField";
import { COUNTRIES, OCCUPATIONS } from "@/features/onboarding/lib/choices";
import { saveProfileStep } from "@/features/onboarding/services/onboarding.functions";

export const Route = createFileRoute("/onboarding/profile")({
  head: () => ({
    meta: [
      { title: "Informations personnelles — Ouverture de compte RFC" },
      { name: "description", content: "Renseignez vos informations personnelles pour ouvrir votre compte RFC." },
      { property: "og:title", content: "Informations personnelles — RFC FINANCE Bank" },
      { property: "og:description", content: "Première étape sécurisée de l’ouverture de compte RFC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ProfileStepPage,
});

function ProfileStepPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const navigate = useNavigate();
  const { data: context, isPending } = useCustomerContext();
  const invalidate = useInvalidateCustomerContext();
  const save = useServerFn(saveProfileStep);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const formData = new FormData(event.currentTarget);
    const parsed = profileStepSchema.safeParse({
      firstName: String(formData.get("firstName") ?? ""),
      middleName: String(formData.get("middleName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
      nationality: String(formData.get("nationality") ?? ""),
      countryOfResidence: String(formData.get("countryOfResidence") ?? ""),
      occupation: String(formData.get("occupation") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    });

    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error));
      return;
    }

    setErrors({});
    setPending(true);
    try {
      await save({ data: parsed.data });
      await invalidate();
      await navigate({ to: "/onboarding/address" });
    } catch {
      setFormError((en ? "We could not save your details. Please try again." : "Nous n'avons pas pu enregistrer vos informations. Réessayez."));
    } finally {
      setPending(false);
    }
  }

  if (isPending || !context) {
    return (
      <OnboardingShell stepId="profile" title={en ? "Your personal information" : "Vos informations personnelles"}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">{en ? "Loading…" : "Chargement…"}</span>
        </div>
      </OnboardingShell>
    );
  }

  const profile = context.profile;

  return (
    <OnboardingShell
      stepId="profile"
      title={en ? "Your personal information" : "Vos informations personnelles"}
      description={en ? "This information appears on your application and must match your identity document." : "Ces informations figurent sur votre dossier bancaire et doivent correspondre à votre pièce d'identité."}
      why={en ? "Banking regulations require us to verify the identity of every account holder." : "La réglementation bancaire nous impose de connaître l'identité de chaque titulaire de compte."}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field name="firstName" label={en ? "First name" : "Prénom"} autoComplete="given-name" defaultValue={profile.first_name} error={errors["firstName"]} />
        <Field name="middleName" label={en ? "Middle name (optional)" : "Deuxième prénom (optionnel)"} autoComplete="additional-name" defaultValue={profile.middle_name} error={errors["middleName"]} />
        <Field name="lastName" label={en ? "Last name" : "Nom"} autoComplete="family-name" defaultValue={profile.last_name} error={errors["lastName"]} />
        <Field name="dateOfBirth" label={en ? "Date of birth" : "Date de naissance"} type="date" autoComplete="bday" defaultValue={profile.date_of_birth} error={errors["dateOfBirth"]} />
        <ChoiceField id="profile-nationality" name="nationality" label={en ? "Nationality" : "Nationalité"} options={COUNTRIES} en={en} defaultValue={profile.nationality ?? "Trinidad and Tobago"} error={errors["nationality"]} />
        <ChoiceField id="profile-countryOfResidence" name="countryOfResidence" label={en ? "Country of residence" : "Pays de résidence"} options={COUNTRIES} en={en} defaultValue={profile.country_of_residence ?? "Trinidad and Tobago"} error={errors["countryOfResidence"]} />
        <ChoiceField id="profile-occupation" name="occupation" label={en ? "Occupation" : "Profession"} options={OCCUPATIONS} en={en} allowOther defaultValue={profile.occupation} error={errors["occupation"]} />
        <Field name="phone" label={en ? "Phone number (optional)" : "Numéro de téléphone (optionnel)"} type="tel" autoComplete="tel" defaultValue={profile.phone ?? (profile.country_of_residence && profile.country_of_residence !== "Trinidad and Tobago" ? "" : "+1 868 ")} error={errors["phone"]} />

        {formError ? (
          <p role="alert" className="text-body-sm rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
            {formError}
          </p>
        ) : null}

        <Button type="submit" className="w-full touch-target" loading={pending}>
          {en ? "Save and continue" : "Enregistrer et continuer"}
        </Button>
      </form>
    </OnboardingShell>
  );
}

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete: string;
  defaultValue?: string | null;
  error?: string | undefined;
}) {
  const id = `profile-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
