import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AppPath } from "@/lib/routing";

/** Reusable authenticated page header (compact on mobile, roomier on desktop). */
export function PageHeader({
  title,
  description,
  action,
  status,
  context,
  backTo,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  status?: ReactNode | undefined;
  /** Compact account/period context shown under the title. */
  context?: ReactNode | undefined;
  /** Back destination for detail and task pages. */
  backTo?: AppPath | undefined;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-2">
        {backTo ? (
          <Button variant="ghost" size="icon" className="touch-target -ml-2 shrink-0" asChild>
            <Link to={backTo} aria-label="Retour">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
            {status}
          </div>
          {description ? (
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          {context}
        </div>
      </div>
      {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
    </div>
  );
}
