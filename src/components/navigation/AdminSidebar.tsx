import { Link } from "@tanstack/react-router";

import { ADMIN_NAV } from "@/config/navigation";

/** Administration navigation. Only reachable for authorized staff roles. */
export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <span
          className="flex size-7 items-center justify-center rounded-md bg-foreground text-[0.625rem] font-bold text-background"
          aria-hidden="true"
        >
          BO
        </span>
        <span className="text-sm font-semibold tracking-tight">Back-office</span>
      </div>

      <nav aria-label="Navigation administration" className="flex-1 space-y-0.5 px-2 py-3">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;

          if (item.upcoming) {
            return (
              <span
                key={item.label}
                aria-disabled="true"
                title="Bientôt disponible"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60"
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
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
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
