import { Link } from "@tanstack/react-router";

import { ADMIN_NAV } from "@/config/navigation";
import { englishNavLabel } from "@/components/navigation/CustomerSidebar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

/** Administration navigation. Only reachable for authorized staff roles. */
export function AdminSidebar({ mobileOpen = false, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const { language } = useLanguage();
  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden w-64 shrink-0 border-r border-border bg-surface md:static md:flex md:flex-col", mobileOpen && "flex flex-col")}>
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <span
          className="flex size-7 items-center justify-center rounded-md bg-foreground text-[0.625rem] font-bold text-background"
          aria-hidden="true"
        >
          BO
        </span>
        <span className="text-sm font-semibold tracking-tight">Back-office</span>
      </div>

      <nav aria-label={language === "en" ? "Administration navigation" : "Navigation administration"} className="flex-1 space-y-0.5 px-2 py-3">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;

          if (item.upcoming) {
            return (
              <span
                key={item.label}
                aria-disabled="true"
                title={language === "en" ? "Coming soon" : "Bientôt disponible"}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60"
              >
                <Icon className="size-4" aria-hidden="true" />
                {language === "en" ? englishNavLabel(item.label) : item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.to}
              activeProps={{
                className: "bg-muted font-medium text-foreground",
                "aria-current": "page",
              }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={onNavigate}
            >
              <Icon className="size-4" aria-hidden="true" />
              {language === "en" ? englishNavLabel(item.label) : item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
