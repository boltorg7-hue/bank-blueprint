import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { fieldErrorsFrom, registerSchema } from "@/features/auth/schemas/auth.schemas";
import { signUpErrorMessage } from "@/features/auth/lib/auth-errors";
import { supabase } from "@/integrations/supabase/client";

/**
 * First registration step only (§8): identity basics, credentials, consent.
 * The banking profile is collected progressively during onboarding.
 */
export function RegisterForm() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const formData = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      terms,
      marketing,
    });

    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error));
      return;
    }

    setErrors({});
    setPending(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          phone: parsed.data.phone,
          terms_accepted: "true",
          marketing_consent: parsed.data.marketing ? "true" : "false",
        },
      },
    });

    if (error) {
      setPending(false);
      setFormError(signUpErrorMessage(error));
      return;
    }

    // With e-mail confirmation enabled, signUp does NOT create a session:
    // the customer must confirm before continuing (§14).
    if (data.session) {
      await navigate({ to: "/onboarding", replace: true });
      return;
    }
    await navigate({ to: "/verify-email", search: { email: parsed.data.email }, replace: true });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field name="firstName" label="Prénom" autoComplete="given-name" error={errors["firstName"]} />
      <Field name="lastName" label="Nom" autoComplete="family-name" error={errors["lastName"]} />
      <Field
        name="email"
        label="Adresse e-mail"
        type="email"
        autoComplete="email"
        error={errors["email"]}
      />
      <Field
        name="phone"
        label="Numéro de téléphone (optionnel)"
        type="tel"
        autoComplete="tel"
        error={errors["phone"]}
      />

      <PasswordField
        name="password"
        label="Mot de passe"
        autoComplete="new-password"
        error={errors["password"]}
        showRules
      />
      <PasswordField
        name="confirmPassword"
        label="Confirmer le mot de passe"
        autoComplete="new-password"
        error={errors["confirmPassword"]}
      />

      <div className="space-y-3 rounded-xl border border-border bg-surface px-4 py-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={terms}
            onCheckedChange={(value) => setTerms(value === true)}
            aria-describedby={errors["terms"] ? "terms-error" : undefined}
          />
          <Label htmlFor="terms" className="text-body-sm leading-relaxed font-normal">
            J'accepte les{" "}
            <Link to="/terms" className="text-brand underline-offset-4 hover:underline">
              conditions générales
            </Link>{" "}
            et la{" "}
            <Link to="/privacy" className="text-brand underline-offset-4 hover:underline">
              politique de confidentialité
            </Link>
            .
          </Label>
        </div>
        {errors["terms"] ? (
          <p id="terms-error" className="text-caption text-destructive">
            {errors["terms"]}
          </p>
        ) : null}

        <div className="flex items-start gap-3">
          <Checkbox
            id="marketing"
            checked={marketing}
            onCheckedChange={(value) => setMarketing(value === true)}
          />
          <Label htmlFor="marketing" className="text-body-sm leading-relaxed font-normal">
            Je souhaite recevoir des informations sur les nouveautés RFC (optionnel).
          </Label>
        </div>
      </div>

      {formError ? (
        <p role="alert" className="text-body-sm rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full touch-target" loading={pending}>
        Créer mon compte
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete: string;
  error?: string | undefined;
}) {
  const id = `register-${name}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
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
