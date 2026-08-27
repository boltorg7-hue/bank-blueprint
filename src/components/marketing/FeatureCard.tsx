import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Public-site feature block (PROMPT 01 §31). Sober, factual, no hype. */
export function FeatureCard({
  title,
  description,
  icon: Icon,
  footer,
  className,
}: {
  title: string;
  description: string;
  icon?: ComponentType<{ className?: string }>;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong",
        className,
      )}
    >
      {Icon && (
        <span
          aria-hidden="true"
          className="mb-4 flex size-10 items-center justify-center rounded-lg bg-brand-muted text-brand"
        >
          <Icon className="size-5" />
        </span>
      )}
      <h3 className="text-heading-sm text-foreground">{title}</h3>
      <p className="text-body-sm mt-2 text-muted-foreground">{description}</p>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
