import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Section title block used across the public site (PROMPT 02 §87). */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "start",
  as = "h2",
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  as?: "h1" | "h2" | "h3";
  actions?: ReactNode;
  className?: string;
}) {
  const Heading = as;
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && <p className="text-overline text-brand">{eyebrow}</p>}
      <Heading className={as === "h1" ? "text-display text-foreground" : "text-heading-lg text-foreground"}>
        {title}
      </Heading>
      {description && (
        <p className={cn("text-body max-w-prose text-muted-foreground", align === "center" && "mx-auto")}>
          {description}
        </p>
      )}
      {actions && <div className="mt-1 flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

/** Vertical rhythm wrapper with a controlled max-width container (§72). */
export function PublicSection({
  children,
  className,
  id,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "sunken" | "contrast";
}) {
  return (
    <section
      {...(id ? { id } : {})}
      className={cn(
        "px-4 py-14 sm:px-6 sm:py-20",
        tone === "sunken" && "bg-surface-sunken",
        tone === "contrast" && "bg-primary text-primary-foreground",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}
