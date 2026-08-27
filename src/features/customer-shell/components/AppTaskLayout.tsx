import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AppPath } from "@/lib/routing";

/**
 * Immersive task layout for future transactional flows (§52, §53):
 * back navigation, compact title, scrollable content and a safe-area aware
 * sticky action bar that never covers the form content.
 */
export function AppTaskLayout({
  title,
  backTo,
  children,
  actions,
}: {
  title: string;
  backTo: AppPath;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
        <Button variant="ghost" size="icon" className="touch-target" asChild>
          <Link to={backTo} aria-label="Retour">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-5 sm:px-6 sm:py-8">{children}</div>

      {actions ? (
        <div className="safe-pb sticky bottom-0 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 sm:flex-row sm:justify-end">
            {actions}
          </div>
        </div>
      ) : null}
    </div>
  );
}
