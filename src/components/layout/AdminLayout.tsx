import type { ReactNode } from "react";
import { Menu } from "lucide-react";

import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { Button } from "@/components/ui/button";

/**
 * Operational console shell for authorized bank staff.
 * Never reused as a customer layout; contains no customer marketing chrome.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh-safe flex bg-surface-sunken">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-pt sticky top-0 z-30 border-b border-border bg-surface">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="touch-target md:hidden"
                aria-label="Navigation administration (bientôt disponible)"
                disabled
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
              <p className="text-sm font-medium text-muted-foreground">Console opérationnelle</p>
            </div>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              Accès restreint
            </span>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-5 sm:px-6 sm:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
