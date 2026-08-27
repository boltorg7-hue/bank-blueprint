import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fieldErrorsFrom, forgotPasswordSchema } from "@/features/auth/schemas/auth.schemas";
import { supabase } from "@/integrations/supabase/client";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Password recovery request (§21). The confirmation message is identical
 * whether or not an account exists, so account existence never leaks.
 */
export function ForgotPasswordForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [pending, setPending] = useState(false);

  async function submit(email: string) {
    setPending(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    setSent(true);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const timer = setInterval(() => {
      setCooldown((value) => {
        if (value <= 1) {
          clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = forgotPasswordSchema.safeParse({ email: String(formData.get("email") ?? "") });
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error));
      return;
    }
    setErrors({});
    await submit(parsed.data.email);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="recovery-email">Adresse e-mail</Label>
        <Input
          id="recovery-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-invalid={errors["email"] ? true : undefined}
        />
        {errors["email"] ? <p className="text-caption text-destructive">{errors["email"]}</p> : null}
      </div>

      {sent ? (
        <p role="status" className="text-body-sm rounded-lg border border-border bg-surface px-3 py-3 text-foreground">
          Si un compte correspond à cette adresse, un lien de réinitialisation vient d'être envoyé.
          Vérifiez également votre dossier de courriers indésirables.
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full touch-target"
        loading={pending}
        disabled={cooldown > 0}
      >
        {cooldown > 0
          ? `Nouvel envoi possible dans ${cooldown} s`
          : sent
            ? "Envoyer à nouveau"
            : "Envoyer le lien de réinitialisation"}
      </Button>
    </form>
  );
}
