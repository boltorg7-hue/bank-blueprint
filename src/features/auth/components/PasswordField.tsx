import { useId, useState } from "react";
import { CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_RULES } from "@/features/auth/schemas/auth.schemas";
import { useLanguage } from "@/components/providers/LanguageProvider";

function passwordRuleState(value: string) {
  return [
    value.length >= 12,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /\d/.test(value),
  ];
}

/** Accessible password input with live rule feedback. Values are never logged. */
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
  const { language } = useLanguage();
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const ruleStates = passwordRuleState(value);
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
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute inset-y-0 right-0 my-auto"
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
          <span className="sr-only">
            {language === "en"
              ? visible
                ? "Hide password"
                : "Show password"
              : visible
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"}
          </span>
        </Button>
      </div>

      {showRules ? (
        <ul
          id={`${id}-rules`}
          aria-live="polite"
          className="space-y-1 rounded-lg border border-border bg-surface-sunken px-3 py-2 text-caption"
        >
          {PASSWORD_RULES.map((rule, index) => {
            const valid = ruleStates[index];
            return (
              <li key={rule} className="flex items-center gap-2">
                {valid ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
                ) : (
                  <XCircle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                )}
                <span className={valid ? "text-foreground" : "text-muted-foreground"}>
                  {language === "en"
                    ? ({
                        "12 caractères minimum": "At least 12 characters",
                        "au moins une lettre majuscule et une minuscule":
                          "at least one uppercase and one lowercase letter",
                        "au moins un chiffre": "at least one number",
                      } as Record<string, string>)[rule] ?? rule
                    : rule}
                </span>
              </li>
            );
          })}
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
