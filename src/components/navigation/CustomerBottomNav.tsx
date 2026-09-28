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
      className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex w-full max-w-md items-stretch px-2">
        {CUSTOMER_PRIMARY_NAV.map((item) => {
          const Icon = item.icon;

          if (item.upcoming) {
            return (
              <li key={item.label} className="flex-1">
                <span
                  aria-disabled="true"
                  title={language === "en" ? "Coming soon" : "Bientôt disponible"}
                   className="touch-target flex h-16 flex-col items-center justify-center gap-1 text-muted-foreground/40"
                >
                  <Icon className="size-5" aria-hidden="true" />
                   <span className="text-[0.625rem] font-medium leading-none tracking-tight">
                     {language === "en" ? englishNavLabel(item.label) : item.label}
                   </span>
                </span>
              </li>
            );
          }

          const selected = pathname === item.to || 
            (item.to === "/app/transfers/new" && pathname.startsWith("/app/transfers")) || 
            (item.to === "/app/accounts" && pathname.startsWith("/app/accounts")) || 
            (item.to === "/app/activity" && pathname.startsWith("/app/transactions"));
          
          return (
            <li key={item.label} className="flex-1">
              <Link
                to={item.to}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "touch-target press-feedback flex h-16 flex-col items-center justify-center gap-1 transition-colors active:press-feedback-active",
                  selected ? "text-brand" : "text-muted-foreground",
                )}
              >
                <div className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-all duration-200",
                  selected && "bg-brand/10 scale-110"
                )}>
                  <Icon className={cn("size-5 transition-transform", selected && "stroke-[2.5px]")} aria-hidden="true" />
                </div>
                <span className={cn(
                  "text-[0.625rem] font-medium leading-none tracking-tight transition-opacity",
                  selected ? "opacity-100" : "opacity-80"
                )}>
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
