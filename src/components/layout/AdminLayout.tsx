import type { ReactNode } from "react";
import { Menu, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { LanguageSwitch } from "@/components/navigation/LanguageSwitch";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { useAdminContext } from "@/features/admin/hooks/useAdmin";

function roleLabel(role: string, en: boolean) {
  const labels: Record<string, [string, string]> = {
    super_admin: ["Super administrateur", "Super administrator"],
    administrator: ["Administrateur", "Administrator"],
    supervisor: ["Superviseur", "Supervisor"],
    finance_operator: ["Opérateur finance", "Finance operator"],
    compliance_officer: ["Conformité", "Compliance officer"],
    kyc_agent: ["Agent KYC", "KYC agent"],
    support_agent: ["Support", "Support agent"],
    auditor: ["Auditeur", "Auditor"],
  };
  return labels[role]?.[en ? 1 : 0] ?? role.replaceAll("_", " ");
}

/**
 * Operational console shell for authorized bank staff.
 * Never reused as a customer layout; contains no customer marketing chrome.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const staff = useAdminContext();
  const en = language === "en";
  const primaryRole = staff.data?.roles[0] ?? null;

  return (
    <div className="min-h-dvh-safe flex bg-surface-sunken">
      <AdminSidebar mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed inset-0 z-[35] h-full w-full rounded-none bg-foreground/40 lg:hidden"
          aria-label={en ? "Close navigation" : "Fermer la navigation"}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-pt sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="touch-target lg:hidden"
                aria-label={en ? "Open admin navigation" : "Ouvrir la navigation administration"}
                onClick={() => setMobileOpen((open) => !open)}
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{en ? "Operations console" : "Console opérationnelle"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {staff.data?.department ?? (en ? "Restricted staff area" : "Espace réservé au personnel")}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {staff.data?.authorized && primaryRole && (
                <span className="hidden items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium sm:inline-flex">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  {roleLabel(primaryRole, en)}
                </span>
              )}
              <LanguageSwitch />
              <span className="hidden rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground lg:inline-flex">
                {en ? "Restricted access" : "Accès restreint"}
              </span>
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-5 sm:px-6 sm:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
