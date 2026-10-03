import { Link, useRouterState } from "@tanstack/react-router";

import { CUSTOMER_PRIMARY_NAV } from "@/config/navigation";
import { englishNavLabel } from "@/components/navigation/CustomerSidebar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

export function CustomerBottomNav() {
  const { language } = useLanguage();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      aria-label={language === "en" ? "Customer navigation (mobile)" : "Navigation client (mobile)"}
      className="safe-px safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 shadow-[var(--shadow-elevated)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex min-h-16 w-full max-w-lg items-stretch px-1.5 sm:px-2">
        {CUSTOMER_PRIMARY_NAV.map((item) => {
          const Icon = item.icon;

          if (item.upcoming) {
            return (
              <li key={item.label} className="min-w-0 flex-1">
                <span
                  aria-disabled="true"
                  title={language === "en" ? "Coming soon" : "Bientôt disponible"}
                  className="touch-target flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-muted-foreground/40"
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                  <span className="max-w-full truncate text-[0.625rem] font-medium leading-none tracking-tight">
                    {language === "en" ? englishNavLabel(item.label) : item.label}
                  </span>
                </span>
              </li>
            );
          }

          const selected =
            pathname === item.to ||
            (item.to === "/app/transfers/new" && pathname.startsWith("/app/transfers")) ||
            (item.to === "/app/accounts" && pathname.startsWith("/app/accounts")) ||
            (item.to === "/app/activity" && pathname.startsWith("/app/transactions"));

          return (
            <li key={item.label} className="min-w-0 flex-1">
              <Link
                to={item.to}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "touch-target relative flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 transition-colors active:press-feedback-active",
                  selected ? "text-brand" : "text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                    selected && "scale-105 bg-brand/10",
                  )}
                >
                  <Icon
                    className={cn("size-5 transition-transform", selected && "stroke-[2.5px]")}
                    aria-hidden="true"
                  />
                </div>
                {selected ? <span aria-hidden="true" className="absolute top-0 h-0.5 w-7 rounded-full bg-brand" /> : null}
                <span
                  className={cn(
                    "max-w-full truncate text-[0.625rem] font-medium leading-none tracking-tight transition-opacity",
                    selected ? "opacity-100" : "opacity-80",
                  )}
                >
                  {language === "en" ? englishNavLabel(item.label) : item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
