import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { fieldErrorsFrom, registerSchema } from "@/features/auth/schemas/auth.schemas";
import { genericErrorMessage, signUpErrorMessage } from "@/features/auth/lib/auth-errors";
import { supabase } from "@/integrations/supabase/client";
import { registerCustomer } from "@/features/auth/services/registration.functions";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * First registration step only: identity basics, credentials, consent.
 * Verified phone and banking profile are collected progressively during onboarding.
 */
export function RegisterForm() {
  const { language } = useLanguage();
  const en = language === "en";
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      terms,
      marketing,
    });

    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error, en ? "en" : "fr"));
      return;
    }

    setErrors({});
    setPending(true);

    let result: Awaited<ReturnType<typeof registerCustomer>>;
    try {
      result = await registerCustomer({ data: parsed.data });
    } catch {
      setFormError(genericErrorMessage(en ? "en" : "fr"));
      setPending(false);
      return;
    }

    if (!result.ok) {
      setFormError(signUpErrorMessage({ code: result.code }, en ? "en" : "fr"));
      setPending(false);
      return;
    }

    // Email confirmation may be disabled in non-production environments.
    // Restore a returned session in the browser without persisting credentials on the server.
    if (result.session) {
      try {
        const { error } = await supabase.auth.setSession(result.session);
        if (error) throw error;
        await navigate({ to: "/onboarding", replace: true });
      } catch {
        setFormError(genericErrorMessage(en ? "en" : "fr"));
      } finally {
        setPending(false);
      }
      return;
    }

    setPending(false);
    await navigate({ to: "/verify-email", search: { email: parsed.data.email }, replace: true });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          name="firstName"
          label={en ? "First name" : "Prénom"}
          autoComplete="given-name"
          error={errors["firstName"]}
        />
        <Field
          name="lastName"
          label={en ? "Last name" : "Nom"}
          autoComplete="family-name"
          error={errors["lastName"]}
        />
      </div>

      <Field
        name="email"
        label={en ? "Email address" : "Adresse e-mail"}
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        error={errors["email"]}
      />
      <p className="-mt-3 text-caption text-muted-foreground">
        {en
          ? "A confirmation link will be sent to this address."
          : "Un lien de confirmation sera envoyé à cette adresse."}
      </p>

      <PasswordField
        name="password"
        label={en ? "Password" : "Mot de passe"}
        autoComplete="new-password"
        error={errors["password"]}
        showRules
      />
      <PasswordField
        name="confirmPassword"
        label={en ? "Confirm password" : "Confirmer le mot de passe"}
        autoComplete="new-password"
        error={errors["confirmPassword"]}
      />

      <div className="space-y-4 rounded-xl border border-border bg-surface-sunken p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={terms}
            onCheckedChange={(value) => setTerms(value === true)}
            aria-describedby={errors["terms"] ? "terms-error" : undefined}
          />
          <Label htmlFor="terms" className="text-body-sm leading-relaxed font-normal">
            {en ? "I accept the" : "J'accepte les"}{" "}
            <Link to="/terms" className="font-medium text-brand underline-offset-4 hover:underline">
              {en ? "terms" : "conditions générales"}
            </Link>{" "}
            {en ? "and the" : "et la"}{" "}
            <Link
              to="/privacy"
              className="font-medium text-brand underline-offset-4 hover:underline"
            >
              {en ? "privacy policy" : "politique de confidentialité"}
            </Link>
            .
          </Label>
        </div>
        {errors["terms"] ? (
          <p id="terms-error" className="text-caption text-destructive">
            {errors["terms"]}
          </p>
        ) : null}

        <div className="flex items-start gap-3 border-t border-border pt-3">
          <Checkbox
            id="marketing"
            checked={marketing}
            onCheckedChange={(value) => setMarketing(value === true)}
          />
          <Label htmlFor="marketing" className="text-body-sm leading-relaxed font-normal">
            {en
              ? "I would like to receive RF BANK updates (optional)."
              : "Je souhaite recevoir les actualités de RF BANK (facultatif)."}
          </Label>
        </div>
      </div>

      {formError ? (
        <p
          role="alert"
          aria-live="polite"
          className="text-body-sm rounded-lg bg-destructive/10 px-3 py-2 text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full touch-target"
        loading={pending}
        loadingLabel={en ? "Creating your account…" : "Création de votre compte…"}
        disabled={pending}
      >
        {en ? "Create my account" : "Créer mon compte"}
      </Button>
      <p className="text-caption text-center text-muted-foreground">
        {en
          ? "You will complete identity verification before banking access is enabled."
          : "La vérification de votre identité sera effectuée avant l'activation de l'accès bancaire."}
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  autoCapitalize,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete: string;
  autoCapitalize?: string;
  error?: string | undefined;
}) {
  const id = `register-${name}`;
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        inputMode={type === "email" ? "email" : undefined}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        spellCheck={type === "email" ? false : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        required
      />
      {error ? (
        <p id={`${id}-error`} className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
