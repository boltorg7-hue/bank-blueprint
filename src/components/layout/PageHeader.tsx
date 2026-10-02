import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AppPath } from "@/lib/routing";

export function PageHeader({
  title,
  description,
  action,
  status,
  context,
  backTo,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  status?: ReactNode;
  context?: ReactNode;
  backTo?: AppPath;
}) {
  return (
    <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
        {backTo ? (
          <Button variant="ghost" size="icon" className="touch-target -ml-2 shrink-0" asChild>
            <Link to={backTo} aria-label="Retour">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}

        <div className="min-w-0 space-y-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="min-w-0 text-heading-lg text-balance text-foreground sm:text-2xl md:text-3xl">
              {title}
            </h1>
            {status}
          </div>

          {description ? (
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}

          {context}
        </div>
      </div>

      {action ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:mt-1 sm:shrink-0 sm:justify-end">
          {action}
        </div>
      ) : null}
    </div>
  );
}
