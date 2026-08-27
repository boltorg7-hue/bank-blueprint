import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/features/auth/components/PasswordField";
import { fieldErrorsFrom, loginSchema } from "@/features/auth/schemas/auth.schemas";
import { signInErrorMessage } from "@/features/auth/lib/auth-errors";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostLoginRoute } from "@/features/auth/lib/post-login";

export function LoginForm({ redirectTo }: { redirectTo?: string | undefined }) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error));
      return;
    }

    setErrors({});
    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setPending(false);
      setFormError(signInErrorMessage(error));
      return;
    }

    const target = await resolvePostLoginRoute(redirectTo);
    await navigate({ to: target, replace: true });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login-email">Adresse e-mail</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-invalid={errors["email"] ? true : undefined}
          aria-describedby={errors["email"] ? "login-email-error" : undefined}
          required
        />
        {errors["email"] ? (
          <p id="login-email-error" className="text-caption text-destructive">
            {errors["email"]}
          </p>
        ) : null}
      </div>

      <PasswordField
        name="password"
        label="Mot de passe"
        autoComplete="current-password"
        error={errors["password"]}
      />

      {formError ? (
        <p role="alert" className="text-body-sm rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full touch-target" loading={pending}>
        Se connecter
      </Button>
    </form>
  );
}
