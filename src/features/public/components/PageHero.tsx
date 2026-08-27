import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Hero for inner public pages (§34). Mobile order: headline → copy → actions.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-border bg-surface-sunken px-4 py-12 sm:px-6 sm:py-16", className)}>
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="min-w-0 space-y-4">
          {eyebrow && <p className="text-overline text-brand">{eyebrow}</p>}
          <h1 className="text-display text-balance text-foreground">{title}</h1>
          <p className="text-body-lg max-w-prose text-muted-foreground">{description}</p>
          {actions && <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">{actions}</div>}
        </div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </section>
  );
}
