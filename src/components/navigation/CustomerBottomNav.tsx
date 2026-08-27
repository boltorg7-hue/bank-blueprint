import { Link } from "@tanstack/react-router";

import { CUSTOMER_PRIMARY_NAV } from "@/config/navigation";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom navigation: five destinations maximum, icon + visible label,
 * safe-area aware, no hover dependency.
 */
export function CustomerBottomNav() {
  return (
    <nav
      aria-label="Navigation client (mobile)"
      className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex w-full max-w-3xl items-stretch">
        {CUSTOMER_PRIMARY_NAV.map((item) => {
          const Icon = item.icon;

          if (item.upcoming) {
            return (
              <li key={item.label} className="flex-1">
                <span
                  aria-disabled="true"
                  title="Bientôt disponible"
                  className="touch-target flex h-full flex-col items-center justify-center gap-1 px-1 py-2 text-muted-foreground/60"
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className="text-[0.6875rem] leading-none">{item.label}</span>
                </span>
              </li>
            );
          }

          return (
            <li key={item.label} className="flex-1">
              <Link
                to={item.to}
                activeProps={{
                  className: "text-brand font-semibold",
                  "aria-current": "page",
                }}
                className={cn(
                  "touch-target flex h-full flex-col items-center justify-center gap-1 px-1 py-2 text-muted-foreground transition-colors",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="text-[0.6875rem] leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
