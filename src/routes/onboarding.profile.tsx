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
import { saveProfileStep } from "@/features/onboarding/services/onboarding.functions";

export const Route = createFileRoute("/onboarding/profile")({
  component: ProfileStepPage,
});

function ProfileStepPage() {
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
      setFormError("Nous n'avons pas pu enregistrer vos informations. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  if (isPending || !context) {
    return (
      <OnboardingShell stepId="profile" title="Vos informations personnelles">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">Chargement…</span>
        </div>
      </OnboardingShell>
    );
  }

  const profile = context.profile;

  return (
    <OnboardingShell
      stepId="profile"
      title="Vos informations personnelles"
      description="Ces informations figurent sur votre dossier bancaire et doivent correspondre à votre pièce d'identité."
      why="La réglementation bancaire nous impose de connaître l'identité de chaque titulaire de compte."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field name="firstName" label="Prénom" autoComplete="given-name" defaultValue={profile.first_name} error={errors["firstName"]} />
        <Field name="middleName" label="Deuxième prénom (optionnel)" autoComplete="additional-name" defaultValue={profile.middle_name} error={errors["middleName"]} />
        <Field name="lastName" label="Nom" autoComplete="family-name" defaultValue={profile.last_name} error={errors["lastName"]} />
        <Field name="dateOfBirth" label="Date de naissance" type="date" autoComplete="bday" defaultValue={profile.date_of_birth} error={errors["dateOfBirth"]} />
        <Field name="nationality" label="Nationalité" autoComplete="country-name" defaultValue={profile.nationality} error={errors["nationality"]} />
        <Field name="countryOfResidence" label="Pays de résidence" autoComplete="country-name" defaultValue={profile.country_of_residence} error={errors["countryOfResidence"]} />
        <Field name="occupation" label="Profession" autoComplete="organization-title" defaultValue={profile.occupation} error={errors["occupation"]} />
        <Field name="phone" label="Numéro de téléphone (optionnel)" type="tel" autoComplete="tel" defaultValue={profile.phone} error={errors["phone"]} />

        {formError ? (
          <p role="alert" className="text-body-sm rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
            {formError}
          </p>
        ) : null}

        <Button type="submit" className="w-full touch-target" loading={pending}>
          Enregistrer et continuer
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
