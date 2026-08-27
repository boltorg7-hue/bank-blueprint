import type { ComponentType } from "react";
import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Security/trust statement (PROMPT 01 §32). Claims must stay factual and
 * verifiable — never imply certifications the platform does not hold.
 */
export function SecurityFeature({
  title,
  description,
  icon: Icon = ShieldCheck,
  className,
}: {
  title: string;
  description: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3", className)}>
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-primary"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <h3 className="text-label text-foreground">{title}</h3>
        <p className="text-body-sm mt-1 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
