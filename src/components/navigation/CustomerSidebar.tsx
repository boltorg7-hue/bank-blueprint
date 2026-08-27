import { Link } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";

import { BrandMark } from "@/components/navigation/BrandMark";
import { CUSTOMER_DESKTOP_NAV, CUSTOMER_SECONDARY_NAV, type NavItem } from "@/config/navigation";

function SidebarItem({ item }: { item: NavItem }) {
  const Icon = item.icon;

  if (item.upcoming) {
    return (
      <span
        aria-disabled="true"
        title="Bientôt disponible"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/60"
      >
        <Icon className="size-4" aria-hidden="true" />
        {item.label}
      </span>
    );
  }

  return (
    <Link
      to={item.to}
      activeProps={{
        className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        "aria-current": "page",
      }}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <Icon className="size-4" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

/** Desktop customer navigation. Contains no administrative destinations. */
export function CustomerSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-16 items-center px-5">
        <BrandMark to="/app/dashboard" />
      </div>

      <nav aria-label="Navigation client (latérale)" className="flex-1 space-y-1 px-3 py-2">
        {CUSTOMER_DESKTOP_NAV.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}

        <p className="px-3 pt-5 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Compte
        </p>
        {CUSTOMER_SECONDARY_NAV.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <LifeBuoy className="size-3.5" aria-hidden="true" />
          Assistance 7j/7
        </span>
      </div>
    </aside>
  );
}
