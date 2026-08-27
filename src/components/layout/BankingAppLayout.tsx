import type { ReactNode } from "react";

import { CustomerBottomNav } from "@/components/navigation/CustomerBottomNav";
import { CustomerSidebar } from "@/components/navigation/CustomerSidebar";
import { AccountContextProvider } from "@/features/customer-shell/context/AccountContext";
import { CustomerAppHeader } from "@/features/customer-shell/components/CustomerAppHeader";
import { NetworkStatusBanner } from "@/features/customer-shell/components/NetworkStatusBanner";

/**
 * Authenticated customer application shell.
 *
 * Persistent chrome (header, navigation) stays mounted between customer
 * routes. Never reuse PublicLayout or AdminLayout here.
 */
export function BankingAppLayout({ children }: { children: ReactNode }) {
  return (
    <AccountContextProvider>
      <div className="min-h-dvh-safe flex bg-surface-sunken">
        <CustomerSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <CustomerAppHeader />
          <NetworkStatusBanner />

          <main id="main" className="pb-mobile-nav flex-1 lg:pb-10">
            {children}
          </main>
        </div>

        <CustomerBottomNav />
      </div>
    </AccountContextProvider>
  );
}

export type ContentWidth = "default" | "narrow" | "wide";

/** Reusable content container for authenticated banking pages. */
export function BankingContentContainer({
  children,
  width = "default",
}: {
  children: ReactNode;
  width?: ContentWidth;
}) {
  const maxWidth =
    width === "narrow" ? "max-w-2xl" : width === "wide" ? "max-w-7xl" : "max-w-5xl";

  return (
    <div className={`mx-auto w-full px-4 py-5 sm:px-6 sm:py-8 ${maxWidth}`}>{children}</div>
  );
}
