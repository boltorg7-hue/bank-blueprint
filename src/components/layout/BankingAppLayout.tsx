import type { ReactNode } from "react";

import { CustomerBottomNav } from "@/components/navigation/CustomerBottomNav";
import { CustomerSidebar } from "@/components/navigation/CustomerSidebar";
import { AccountsShellProvider } from "@/features/accounts/components/AccountsShellProvider";
import { CustomerAppHeader } from "@/features/customer-shell/components/CustomerAppHeader";
import { NetworkStatusBanner } from "@/features/customer-shell/components/NetworkStatusBanner";

export function BankingAppLayout({ children }: { children: ReactNode }) {
  return (
    <AccountsShellProvider>
      <div className="flex min-h-dvh-safe bg-surface-sunken">
        <CustomerSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <CustomerAppHeader />
          <NetworkStatusBanner />

          <main id="main" className="min-w-0 flex-1 overscroll-x-none pb-mobile-nav lg:pb-10">
            {children}
          </main>
        </div>

        <CustomerBottomNav />
      </div>
    </AccountsShellProvider>
  );
}

export type ContentWidth = "default" | "narrow" | "wide";

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
    <div
      className={[
        "mx-auto w-full min-w-0",
        "px-4 py-5 sm:px-6 sm:py-8",
        "lg:px-8 lg:py-10",
        maxWidth,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
