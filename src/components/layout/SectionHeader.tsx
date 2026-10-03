import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({ title, description, action, className }: {
  title: string; description?: string; action?: ReactNode; className?: string;
}) {
  return <div className={cn("flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4", className)}>
    <div className="min-w-0 space-y-1"><h2 className="text-heading-md text-balance text-foreground">{title}</h2>{description ? <p className="max-w-prose text-body-sm text-muted-foreground">{description}</p> : null}</div>
    {action ? <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">{action}</div> : null}
  </div>;
}
