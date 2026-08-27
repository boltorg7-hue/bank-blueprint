import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";

import type { AppPath } from "@/lib/routing";
import { cn } from "@/lib/utils";

export type QuickAction = {
  label: string;
  to: AppPath;
  icon: LucideIcon;
  /** Requires transactional capability (banking status ACTIVE). */
  transactional?: boolean;
};

/**
 * QuickActions (§36, §37): 2–4 high-priority destinations with generous touch
 * targets. Transactional actions are disabled — never silently broken — when
 * the trusted account status forbids money movement.
 */
export function QuickActions({
  actions,
  canTransact,
  blockedReason,
  className,
}: {
  actions: QuickAction[];
  canTransact: boolean;
  blockedReason?: string | null;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        const blocked = Boolean(action.transactional) && !canTransact;

        if (blocked) {
          return (
            <li key={action.label}>
              <span
                aria-disabled="true"
                className="flex h-full min-h-24 flex-col justify-between rounded-xl border border-border bg-surface-sunken p-4 text-sm text-muted-foreground"
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="mt-3 block font-medium leading-snug">{action.label}</span>
                <span className="mt-1 text-xs leading-snug">
                  {blockedReason ?? "Indisponible pour le moment"}
                </span>
              </span>
            </li>
          );
        }

        return (
          <li key={action.label}>
            <Link
              to={action.to}
              className="press-feedback flex h-full min-h-24 flex-col justify-between rounded-xl border border-border bg-surface p-4 text-sm text-foreground hover:border-brand/40 hover:bg-surface-sunken"
            >
              <Icon className="size-5 text-brand" aria-hidden="true" />
              <span className="mt-3 flex items-center justify-between gap-2 font-medium leading-snug">
                {action.label}
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
