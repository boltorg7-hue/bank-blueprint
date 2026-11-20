import { useLanguage } from "@/components/providers/LanguageProvider";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { BankingAppLayout } from "@/components/layout/BankingAppLayout";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { LimitedAccessBanner } from "@/features/customer-shell/components/LimitedAccessBanner";
import { canEnterBankingShell } from "@/features/customer-shell/lib/route-access";
import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { getOAuthConsentStatus } from "@/features/auth/services/oauth-consent.functions";
import { supabase } from "@/integrations/supabase/client";
import { nextRouteForLifecycle } from "@/types/customer-lifecycle";

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

    const consent = await getOAuthConsentStatus();
    if (consent.required) {
      throw redirect({ to: "/auth/consent", replace: true });
    }

    return { user: data.user };
  },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Espace client — RFC" },
      { name: "description", content: "Espace client sécurisé RFC." },
    ],
  }),
  component: CustomerAppLayoutRoute,
});

function CustomerAppLayoutRoute() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: context, isPending, isError, refetch } = useCustomerContext();
  const lifecycle = context?.profile.lifecycle_state;
  const allowed = lifecycle ? canEnterBankingShell(lifecycle) : false;

  useEffect(() => {
    if (!lifecycle || allowed) return;
    void navigate({ to: nextRouteForLifecycle(lifecycle), replace: true });
  }, [lifecycle, allowed, navigate]);

  if (isError) {
    return (
      <BankingAppLayout>
        <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center" role="alert">
          <p className="text-heading-sm text-foreground">{language === "en" ? "Your customer space could not be prepared" : "Votre espace client n’a pas pu être chargé"}</p>
          <p className="text-body-sm text-muted-foreground">{language === "en" ? "Your account is not blocked. We could not retrieve its status right now. Please retry." : "Votre compte n’est pas bloqué. Nous n’avons pas pu récupérer son statut pour le moment. Réessayez."}</p>
          <Button onClick={() => void refetch()} className="touch-target">{language === "en" ? "Retry" : "Réessayer"}</Button>
        </div>
      </BankingAppLayout>
    );
  }

  if (isPending || !allowed) {
    return (
      <BankingAppLayout>
        <div
          className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground"
          role="status"
        >
          <Spinner className="size-5" />
          <span className="text-body-sm">
            {language === "en" ? "Preparing your account…" : "Préparation de votre espace…"}
          </span>
        </div>
      </BankingAppLayout>
    );
  }

  return (
    <BankingAppLayout>
      {lifecycle ? <LimitedAccessBanner state={lifecycle} /> : null}
      <Outlet />
    </BankingAppLayout>
  );
}
