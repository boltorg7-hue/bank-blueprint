import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { useState } from "react";

import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { LanguageSwitch } from "@/components/navigation/LanguageSwitch";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";

/**
 * Operational console shell for authorized bank staff.
 * Never reused as a customer layout; contains no customer marketing chrome.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-dvh-safe flex bg-surface-sunken">
      <AdminSidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && <Button variant="ghost" size="icon" className="fixed inset-0 z-[35] h-full w-full rounded-none bg-foreground/40 md:hidden" aria-label={language === "en" ? "Close navigation" : "Fermer la navigation"} onClick={() => setMobileOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-pt sticky top-0 z-30 border-b border-border bg-surface">
          <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="touch-target md:hidden"
                 aria-label={language === "en" ? "Open admin navigation" : "Ouvrir la navigation administration"}
                onClick={() => setMobileOpen((open) => !open)}
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
               <p className="truncate text-sm font-medium text-muted-foreground">{language === "en" ? "Operations console" : "Console opérationnelle"}</p>
            </div>
             <div className="flex shrink-0 items-center gap-2"><LanguageSwitch /><span className="hidden rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground sm:inline-flex">
               {language === "en" ? "Restricted access" : "Accès restreint"}
             </span></div>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-5 sm:px-6 sm:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
