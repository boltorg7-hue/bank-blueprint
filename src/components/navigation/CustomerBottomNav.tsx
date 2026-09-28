import { Link, useRouterState } from "@tanstack/react-router";

import { CUSTOMER_PRIMARY_NAV } from "@/config/navigation";
import { englishNavLabel } from "@/components/navigation/CustomerSidebar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom navigation: five destinations maximum, icon + visible label,
 * safe-area aware, no hover dependency.
 */
export function CustomerBottomNav() {
  const { language } = useLanguage();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav
      aria-label={language === "en" ? "Customer navigation (mobile)" : "Navigation client (mobile)"}
      className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 shadow-[var(--shadow-elevated)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex w-full max-w-3xl items-stretch">
        {CUSTOMER_PRIMARY_NAV.map((item) => {
          const Icon = item.icon;

          if (item.upcoming) {
            return (
              <li key={item.label} className="flex-1">
                <span
                  aria-disabled="true"
                  title={language === "en" ? "Coming soon" : "Bientôt disponible"}
                   className="touch-target flex h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-muted-foreground/60"
                >
                  <Icon className="size-5" aria-hidden="true" />
                   <span className="text-caption leading-none">{language === "en" ? englishNavLabel(item.label) : item.label}</span>
                </span>
              </li>
            );
          }

          const selected = pathname === item.to || (item.to === "/app/transfers/new" && pathname.startsWith("/app/transfers")) || (item.to === "/app/accounts" && pathname.startsWith("/app/accounts")) || (item.to === "/app/activity" && pathname.startsWith("/app/transactions"));
          return (
            <li key={item.label} className="flex-1">
              <Link
                to={item.to}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "touch-target press-feedback flex h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-muted-foreground transition-colors active:press-feedback-active",
                  selected && "font-semibold text-brand",
                )}
              >
                <span className={cn("grid size-8 place-items-center rounded-md transition-colors", selected && "bg-brand-muted")}><Icon className="size-5" aria-hidden="true" /></span>
                <span className="text-caption leading-none">{language === "en" ? englishNavLabel(item.label) : item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
