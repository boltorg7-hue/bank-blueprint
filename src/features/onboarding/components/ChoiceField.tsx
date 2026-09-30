import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Choice } from "@/features/onboarding/lib/choices";

const selectClass =
  "touch-target flex h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-base text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 aria-invalid:border-destructive";

/**
 * Native select (opens the phone's own picker) with an optional "Other" free-text fallback.
 * The submitted value is always under `name`.
 */
export function ChoiceField({
  id,
  name,
  label,
  options,
  en,
  defaultValue,
  error,
  allowOther = false,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  options: Choice[];
  en: boolean;
  defaultValue?: string | null | undefined;
  error?: string | undefined;
  allowOther?: boolean;
  onChange?: (value: string) => void;
}) {
  const known = !defaultValue || options.some((o) => o.value === defaultValue);
  const [choice, setChoice] = useState(known ? (defaultValue ?? "") : allowOther ? "__other" : (defaultValue ?? ""));
  const [other, setOther] = useState(known ? "" : (defaultValue ?? ""));
  const isOther = choice === "__other";
  const extra = !known && !allowOther && defaultValue ? [{ value: defaultValue, fr: defaultValue, en: defaultValue }] : [];

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          name={isOther ? undefined : name}
          value={choice}
          className={cn(selectClass, !choice && "text-muted-foreground")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => {
            setChoice(event.target.value);
            if (event.target.value !== "__other") onChange?.(event.target.value);
          }}
        >
          <option value="" disabled>{en ? "Select…" : "Sélectionner…"}</option>
          {[...extra, ...options].map((o) => (
            <option key={o.value} value={o.value}>{en ? o.en : o.fr}</option>
          ))}
          {allowOther ? <option value="__other">{en ? "Other…" : "Autre…"}</option> : null}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      </div>
      {isOther ? (
        <Input
          name={name}
          value={other}
          autoFocus
          aria-label={en ? `${label} (specify)` : `${label} (préciser)`}
          placeholder={en ? "Please specify" : "Précisez"}
          onChange={(event) => {
            setOther(event.target.value);
            onChange?.(event.target.value);
          }}
          className="animate-in fade-in slide-in-from-top-1"
        />
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-caption text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
