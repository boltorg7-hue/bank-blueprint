import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { fieldErrorsFrom, resetPasswordSchema } from "@/features/auth/schemas/auth.schemas";
import { genericErrorMessage } from "@/features/auth/lib/auth-errors";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reset password screen (§22). The recovery session comes from the e-mail link;
 * success is confirmed explicitly instead of silently redirecting.
 */
export function ResetPasswordForm() {
  const [ready, setReady] = useState<"checking" | "ready" | "invalid">("checking");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(data.session ? "ready" : "invalid");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) setReady("ready");
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const formData = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setPending(false);
    if (error) {
      setFormError(genericErrorMessage());
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-5">
        <p
          role="status"
          className="text-body-sm flex items-start gap-2 rounded-xl border border-success/30 bg-success-muted px-4 py-3 text-foreground"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Votre mot de passe a été mis à jour.
        </p>
        <Button asChild className="w-full touch-target">
          <Link to="/onboarding">Continuer</Link>
        </Button>
      </div>
    );
  }

  if (ready === "invalid") {
    return (
      <div className="space-y-5">
        <p className="text-body-sm rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-foreground">
          Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien pour
          continuer.
        </p>
        <Button asChild variant="outline" className="w-full touch-target">
          <Link to="/forgot-password">Demander un nouveau lien</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <PasswordField
        name="password"
        label="Nouveau mot de passe"
        autoComplete="new-password"
        error={errors["password"]}
        showRules
      />
      <PasswordField
        name="confirmPassword"
        label="Confirmer le nouveau mot de passe"
        autoComplete="new-password"
        error={errors["confirmPassword"]}
      />
      {formError ? (
        <p role="alert" className="text-body-sm rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
          {formError}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full touch-target"
        loading={pending || ready === "checking"}
      >
        Mettre à jour mon mot de passe
      </Button>
    </form>
  );
}
