import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { useCustomerContext, useInvalidateCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { addressStepSchema } from "@/features/onboarding/schemas/onboarding.schemas";
import { fieldErrorsFrom } from "@/features/auth/schemas/auth.schemas";
import { saveAddressStep } from "@/features/onboarding/services/onboarding.functions";

export const Route = createFileRoute("/onboarding/address")({
  component: AddressStepPage,
});

function AddressStepPage() {
  const navigate = useNavigate();
  const { data: context, isPending } = useCustomerContext();
  const invalidate = useInvalidateCustomerContext();
  const save = useServerFn(saveAddressStep);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const formData = new FormData(event.currentTarget);
    const parsed = addressStepSchema.safeParse({
      country: String(formData.get("country") ?? ""),
      addressLine1: String(formData.get("addressLine1") ?? ""),
      addressLine2: String(formData.get("addressLine2") ?? ""),
      city: String(formData.get("city") ?? ""),
      region: String(formData.get("region") ?? ""),
      postalCode: String(formData.get("postalCode") ?? ""),
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
      await navigate({ to: "/onboarding/documents" });
    } catch {
      setFormError("Nous n'avons pas pu enregistrer votre adresse. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  if (isPending || !context) {
    return (
      <OnboardingShell stepId="address" title="Votre adresse">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">Chargement…</span>
        </div>
      </OnboardingShell>
    );
  }

  const address = context.address;

  return (
    <OnboardingShell
      stepId="address"
      title="Votre adresse de résidence"
      description="Renseignez l'adresse où vous résidez habituellement. Les champs facultatifs peuvent rester vides si votre pays ne les utilise pas."
      why="Votre adresse détermine les services disponibles et doit correspondre à votre justificatif de domicile."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field name="country" label="Pays" autoComplete="country-name" defaultValue={address?.country} error={errors["country"]} />
        <Field name="addressLine1" label="Adresse" autoComplete="address-line1" defaultValue={address?.address_line1} error={errors["addressLine1"]} />
        <Field name="addressLine2" label="Complément d'adresse (optionnel)" autoComplete="address-line2" defaultValue={address?.address_line2} error={errors["addressLine2"]} />
        <Field name="city" label="Ville" autoComplete="address-level2" defaultValue={address?.city} error={errors["city"]} />
        <Field name="region" label="Région, état ou province (si applicable)" autoComplete="address-level1" defaultValue={address?.region} error={errors["region"]} />
        <Field name="postalCode" label="Code postal (si applicable)" autoComplete="postal-code" defaultValue={address?.postal_code} error={errors["postalCode"]} />

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
  autoComplete,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  autoComplete: string;
  defaultValue?: string | null | undefined;
  error?: string | undefined;
}) {
  const id = `address-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
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
