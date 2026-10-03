import { Link } from "@tanstack/react-router";

import { ADMIN_NAV, type NavItem } from "@/config/navigation";
import { englishNavLabel } from "@/components/navigation/CustomerSidebar";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";

const GROUP_LABELS: Record<NonNullable<NavItem["group"]>, [string, string]> = {
  overview: ["Vue d’ensemble", "Overview"],
  operations: ["Opérations", "Operations"],
  management: ["Gestion", "Management"],
};

/** Administration navigation. Only reachable for authorized staff roles. */
export function AdminSidebar({ mobileOpen = false, onNavigate }: { mobileOpen?: boolean; onNavigate?: () => void }) {
  const { language } = useLanguage();
  const en = language === "en";

  return (
    <aside
      aria-label={en ? "Back-office navigation" : "Navigation du back-office"}
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-72 max-w-[85vw] shrink-0 overflow-y-auto border-r border-border bg-surface shadow-sm lg:static lg:flex lg:w-64 lg:max-w-none lg:flex-col lg:shadow-none",
        mobileOpen && "flex flex-col",
      )}
    >
      <div className="flex min-h-14 items-center gap-3 border-b border-border px-4">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-[0.625rem] font-bold tracking-tight text-background"
          aria-hidden="true"
        >
          BO
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">Back-office</p>
          <p className="truncate text-[0.6875rem] text-muted-foreground">
            {en ? "Operational workspace" : "Espace opérationnel"}
          </p>
        </div>
      </div>

      <nav aria-label={en ? "Administration navigation" : "Navigation administration"} className="flex-1 px-3 py-4">
        {ADMIN_NAV.map((item, index) => {
          const Icon = item.icon;
          const previous = index > 0 ? ADMIN_NAV[index - 1]?.group : undefined;
          const showGroup = item.group && item.group !== previous;
          const [fr, labelEn] = item.group ? GROUP_LABELS[item.group] : ["", ""];
          const groupLabel = showGroup ? (
            <p className="px-3 pb-2 pt-5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground first:pt-0">
              {en ? labelEn : fr}
            </p>
          ) : null;

          if (item.upcoming) {
            return (
              <div key={item.label}>
                {groupLabel}
                <span
                  aria-disabled="true"
                  title={en ? "Coming soon" : "Bientôt disponible"}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/60"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {en ? englishNavLabel(item.label) : item.label}
                </span>
              </div>
            );
          }

          return (
            <div key={item.label}>
              {groupLabel}
              <Link
                to={item.to}
                activeProps={{
                  className: "bg-foreground text-background shadow-sm",
                  "aria-current": "page",
                }}
                className="group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-[background-color,color,box-shadow,transform] duration-150 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.985] motion-reduce:transition-none"
                onClick={onNavigate}
              >
                <Icon className="size-4 shrink-0 transition-transform duration-150 group-hover:scale-105 motion-reduce:transition-none" aria-hidden="true" />
                <span className="truncate">{en ? englishNavLabel(item.label) : item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <p className="px-3 text-[0.6875rem] leading-5 text-muted-foreground">
          {en ? "Sensitive actions are permission-controlled and audited." : "Les actions sensibles sont contrôlées par permission et auditées."}
        </p>
      </div>
    </aside>
  );
}
