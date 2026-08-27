import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { groupIdentifier, maskIdentifier } from "@/lib/format/mask";
import { Button } from "@/components/ui/button";

/**
 * Account/IBAN display. Masked by default; revealing is an explicit user action
 * (PROMPT 01 §29). Nothing is copied or logged automatically.
 */
export function MaskedIdentifier({
  value,
  label,
  revealable = true,
  className,
}: {
  value: string;
  label?: string;
  revealable?: boolean;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={cn("min-w-0", className)}>
      {label && <p className="text-overline text-muted-foreground">{label}</p>}
      <div className="flex items-center gap-2">
        <span className="text-numeric text-body-sm break-all text-foreground">
          {revealed ? groupIdentifier(value) : maskIdentifier(value)}
        </span>
        {revealable && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            onClick={() => setRevealed((current) => !current)}
            aria-pressed={revealed}
            aria-label={revealed ? "Masquer l'identifiant" : "Afficher l'identifiant"}
          >
            {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </Button>
        )}
      </div>
    </div>
  );
}
