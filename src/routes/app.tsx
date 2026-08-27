import { createFileRoute, Outlet } from "@tanstack/react-router";

import { BankingAppLayout } from "@/components/layout/BankingAppLayout";

/**
 * Customer banking namespace (/app).
 *
 * The real authentication guard is wired in PROMPT 03: `beforeLoad` will read
 * trusted server session state and redirect to /login or the appropriate
 * onboarding step. Authenticated pages are never indexed.
 */
export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Espace client — Vaultis" },
      { name: "description", content: "Espace client sécurisé Vaultis." },
    ],
  }),
  component: CustomerAppLayoutRoute,
});

function CustomerAppLayoutRoute() {
  return (
    <BankingAppLayout>
      <Outlet />
    </BankingAppLayout>
  );
}
