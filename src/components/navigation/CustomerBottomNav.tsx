import { Link, useRouterState } from "@tanstack/react-router";

import { CUSTOMER_PRIMARY_NAV, isCustomerMoreRoute } from "@/config/navigation";
import { englishNavLabel } from "@/components/navigation/CustomerSidebar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

// Déclenche une micro-vibration tactile lorsque l'API est disponible.
function triggerHaptic() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;

  try {
    navigator.vibrate(8);
  } catch {
    // API non prise en charge ou bloquée : le feedback visuel reste disponible.
  }
}

export function CustomerBottomNav() {
  const { language } = useLanguage();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      aria-label={language === "en" ? "Customer navigation (mobile)" : "Navigation client (mobile)"}
      className="safe-px safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-surface/85 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-2xl supports-[backdrop-filter]:bg-surface/80 lg:hidden"
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
                  className="touch-target flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-muted-foreground/35 select-none"
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
            (item.to === "/app/more" && isCustomerMoreRoute(pathname)) ||
            (item.to === "/app/transfers/new" && pathname.startsWith("/app/transfers")) ||
            (item.to === "/app/accounts" && pathname.startsWith("/app/accounts")) ||
            (item.to === "/app/activity" &&
              (pathname.startsWith("/app/activity") || pathname.startsWith("/app/transactions")));

          return (
            <li key={item.label} className="min-w-0 flex-1">
              <Link
                to={item.to}
                onClick={triggerHaptic}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "touch-target touch-press relative flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 select-none motion-reduce:transition-none",
                  selected ? "text-brand" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 motion-reduce:transition-none",
                    selected ? "bg-brand/12 scale-105" : "bg-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 transition-transform duration-150 motion-reduce:transition-none",
                      selected ? "stroke-[2.4px]" : "stroke-[1.8px]",
                    )}
                    aria-hidden="true"
                  />
                </div>
                {selected && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-6 rounded-full bg-brand"
                  />
                )}
                <span
                  className={cn(
                    "max-w-full truncate text-[0.625rem] tracking-tight transition-all duration-150 motion-reduce:transition-none",
                    selected ? "font-semibold opacity-100" : "font-normal opacity-75",
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
