import { Link } from "@tanstack/react-router";

import { ADMIN_NAV } from "@/config/navigation";
import { englishNavLabel } from "@/components/navigation/CustomerSidebar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

/** Administration navigation. Only reachable for authorized staff roles. */
export function AdminSidebar({ mobileOpen = false, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const { language } = useLanguage();
  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden w-72 max-w-[85vw] shrink-0 overflow-y-auto border-r border-border bg-surface lg:static lg:flex lg:w-64 lg:max-w-none lg:flex-col", mobileOpen && "flex flex-col")}>
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <span
          className="flex size-7 items-center justify-center rounded-md bg-foreground text-[0.625rem] font-bold text-background"
          aria-hidden="true"
        >
          BO
        </span>
        <span className="text-sm font-semibold tracking-tight">Back-office</span>
      </div>

      <nav aria-label={language === "en" ? "Administration navigation" : "Navigation administration"} className="flex-1 px-3 py-4">
        {ADMIN_NAV.map((item, index) => {
          const Icon = item.icon;
          const group = index === 0 ? (language === "en" ? "Overview" : "Vue d’ensemble") : index === 1 ? (language === "en" ? "Operations" : "Opérations") : index === 5 ? (language === "en" ? "Management" : "Gestion") : null;
          const groupLabel = group ? <p className="px-3 pb-2 pt-5 first:pt-0 text-xs font-semibold uppercase text-muted-foreground">{group}</p> : null;

          if (item.upcoming) {
            return (
              <div key={item.label}>
              {groupLabel}
              <span
                aria-disabled="true"
                title={language === "en" ? "Coming soon" : "Bientôt disponible"}
                className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60"
              >
                <Icon className="size-4" aria-hidden="true" />
                {language === "en" ? englishNavLabel(item.label) : item.label}
              </span>
              </div>
            );
          }

          return (
            <div key={item.label}>
            {groupLabel}
            <Link
              key={item.label}
              to={item.to}
              activeProps={{
                className: "bg-muted font-medium text-foreground",
                "aria-current": "page",
              }}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={onNavigate}
            >
              <Icon className="size-4" aria-hidden="true" />
              {language === "en" ? englishNavLabel(item.label) : item.label}
            </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
