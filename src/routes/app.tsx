import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { BankingAppLayout } from "@/components/layout/BankingAppLayout";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { canUseBanking, nextRouteForLifecycle } from "@/types/customer-lifecycle";

/**
 * Customer banking namespace (/app) — §24, §26.
 * Authentication is checked client-side (the session lives in browser storage),
 * then banking access is decided from trusted server state, never localStorage.
 */
export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
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
  const navigate = useNavigate();
  const { data: context, isPending } = useCustomerContext();
  const lifecycle = context?.profile.lifecycle_state;
  const allowed = lifecycle ? canUseBanking(lifecycle) : false;

  useEffect(() => {
    if (!lifecycle || allowed) return;
    void navigate({ to: nextRouteForLifecycle(lifecycle), replace: true });
  }, [lifecycle, allowed, navigate]);

  if (isPending || !allowed) {
    return (
      <BankingAppLayout>
        <div
          className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground"
          role="status"
        >
          <Spinner className="size-5" />
          <span className="text-body-sm">Préparation de votre espace…</span>
        </div>
      </BankingAppLayout>
    );
  }

  return (
    <BankingAppLayout>
      <Outlet />
    </BankingAppLayout>
  );
}
