import { useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fieldErrorsFrom, forgotPasswordSchema } from "@/features/auth/schemas/auth.schemas";
import { supabase } from "@/integrations/supabase/client";

const RESEND_COOLDOWN_SECONDS = 60;

export function ForgotPasswordForm() {
  const { language } = useLanguage();
  const en = language === "en";
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
        <Label htmlFor="recovery-email">{en ? "Email address" : "Adresse e-mail"}</Label>
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
          {en
            ? "If an account matches this address, a reset link has been sent. Also check your spam folder."
            : "Si un compte correspond à cette adresse, un lien de réinitialisation vient d'être envoyé. Vérifiez également votre dossier de courriers indésirables."}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full touch-target"
        loading={pending}
        disabled={cooldown > 0}
      >
        {cooldown > 0
          ? en
            ? `You can resend in ${cooldown} s`
            : `Nouvel envoi possible dans ${cooldown} s`
          : sent
            ? en
              ? "Send again"
              : "Envoyer à nouveau"
            : en
              ? "Send reset link"
              : "Envoyer le lien de réinitialisation"}
      </Button>
    </form>
  );
}
