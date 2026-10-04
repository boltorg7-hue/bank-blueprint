import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";
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
  description?: string | undefined;
  action?: ReactNode;
  status?: ReactNode;
  context?: ReactNode;
  backTo?: AppPath;
}) {
  const { language } = useLanguage();
  return (
    <header className="mb-5 grid min-w-0 grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
        {backTo ? (
          <Button variant="ghost" size="icon" className="touch-target -ml-2 shrink-0" asChild>
            <Link to={backTo} aria-label={language === "en" ? "Back" : "Retour"}>
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
        <div className="min-w-0 space-y-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="text-heading-xl text-balance text-foreground">{title}</h1>
            {status}
          </div>
          {description ? <p className="max-w-prose text-body text-muted-foreground">{description}</p> : null}
          {context ? <div className="pt-1">{context}</div> : null}
        </div>
      </div>
      {action ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:mt-1 sm:shrink-0 sm:justify-end">
          {action}
        </div>
      ) : null}
    </header>
  );
}
