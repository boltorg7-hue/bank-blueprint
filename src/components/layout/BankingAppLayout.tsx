import type { ReactNode } from "react";
import { Bell } from "lucide-react";

import { CustomerBottomNav } from "@/components/navigation/CustomerBottomNav";
import { CustomerSidebar } from "@/components/navigation/CustomerSidebar";
import { BrandMark } from "@/components/navigation/BrandMark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/**
 * Authenticated customer application shell.
 *
 * Persistent chrome (header, navigation) stays mounted between customer
 * routes. Never reuse PublicLayout or AdminLayout here.
 */
export function BankingAppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh-safe flex bg-surface-sunken">
      <CustomerSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-pt sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark to="/app/dashboard" compact className="lg:hidden" />
              <p className="truncate text-sm font-medium text-muted-foreground">Espace client</p>
            </div>

            <div className="flex items-center gap-1.5">
              <PrivacyModeToggle className="touch-target" />
              <ThemeToggle className="touch-target" />
              {/* Notification centre arrives in PROMPT 10 — no fabricated counts. */}
              <Button
                variant="ghost"
                size="icon"
                className="touch-target"
                aria-label="Notifications (bientôt disponible)"
                disabled
              >
                <Bell className="size-5" aria-hidden="true" />
              </Button>
              <Avatar className="size-9">
                <AvatarFallback className="text-xs font-medium">VS</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main id="main" className="pb-mobile-nav flex-1 lg:pb-10">
          {children}
        </main>
      </div>

      <CustomerBottomNav />
    </div>
  );
}

/** Reusable content container for authenticated banking pages. */
export function BankingContentContainer({
  children,
  width = "default",
}: {
  children: ReactNode;
  width?: "default" | "narrow" | "wide";
}) {
  const maxWidth =
    width === "narrow" ? "max-w-2xl" : width === "wide" ? "max-w-7xl" : "max-w-5xl";

  return (
    <div className={`mx-auto w-full px-4 py-5 sm:px-6 sm:py-8 ${maxWidth}`}>{children}</div>
  );
}
