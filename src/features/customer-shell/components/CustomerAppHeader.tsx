import { Link, useRouterState } from "@tanstack/react-router";
import { Bell } from "lucide-react";

import { BrandMark } from "@/components/navigation/BrandMark";
import { Button } from "@/components/ui/button";
import { PrivacyModeToggle } from "@/components/providers/PrivacyModeProvider";
import { ThemeToggle } from "@/components/providers/ThemeProvider";
import { AccountContextSummary } from "@/features/customer-shell/components/AccountContextSummary";
import { CustomerMenu } from "@/features/customer-shell/components/CustomerMenu";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { contextTitleFor } from "@/features/customer-shell/lib/page-titles";

/**
 * Authenticated header (§17 – §21). It shows page context, privacy control,
 * the notification entry point and the customer menu — never a duplicate of
 * the sidebar navigation, and never a fabricated unread badge.
 */
export function CustomerAppHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { summary } = useCustomerSummary();
  const unread = summary?.unreadNotificationCount ?? null;

  return (
    <header className="safe-pt sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark to="/app/dashboard" compact className="lg:hidden" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {contextTitleFor(pathname)}
            </p>
            <div className="hidden lg:block">
              <AccountContextSummary />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <PrivacyModeToggle className="touch-target" />
          <ThemeToggle className="touch-target" />
          <Button variant="ghost" size="icon" className="touch-target relative" asChild>
            <Link
              to="/app/notifications"
              aria-label={
                unread && unread > 0 ? `Notifications, ${unread} non lues` : "Notifications"
              }
            >
              <Bell className="size-5" aria-hidden="true" />
              {unread && unread > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute right-2 top-2 size-2 rounded-full bg-danger"
                />
              ) : null}
            </Link>
          </Button>
          <CustomerMenu summary={summary} />
        </div>
      </div>
    </header>
  );
}
