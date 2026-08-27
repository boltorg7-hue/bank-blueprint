import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_RULES } from "@/features/auth/schemas/auth.schemas";

/** Accessible password input with a show/hide action (§10). Values are never logged. */
export function PasswordField({
  name,
  label,
  autoComplete,
  error,
  showRules = false,
}: {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  error?: string | undefined;
  showRules?: boolean;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const describedBy = [showRules ? `${id}-rules` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className="pr-12"
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute inset-y-0 right-0 my-auto"
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          </span>
        </Button>
      </div>
      {showRules ? (
        <ul id={`${id}-rules`} className="text-caption space-y-0.5 text-muted-foreground">
          {PASSWORD_RULES.map((rule) => (
            <li key={rule}>• {rule}</li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
