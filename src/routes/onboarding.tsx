import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";

import { BrandMark } from "@/components/navigation/BrandMark";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSignOut } from "@/features/auth/hooks/useSessionUser";

/**
 * Protected onboarding namespace (§24).
 * Client-only gate: the session lives in browser storage, so the check runs
 * after hydration and redirects unauthenticated visitors to /login.
 */
export const Route = createFileRoute("/onboarding")({
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
      { title: "Ouverture de compte — Vaultis" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "description", content: "Parcours sécurisé d'ouverture de compte Vaultis." },
    ],
  }),
  errorComponent: OnboardingError,
  component: OnboardingLayoutRoute,
});

function OnboardingChrome({ children }: { children: React.ReactNode }) {
  const signOut = useSignOut();

  return (
    <div className="min-h-dvh-safe bg-surface-sunken">
      <header className="safe-pt sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
          <BrandMark />
          <Button variant="ghost" size="sm" className="touch-target" onClick={() => void signOut()}>
            Se déconnecter
          </Button>
        </div>
      </header>
      <main id="main" className="safe-pb">
        {children}
      </main>
    </div>
  );
}

function OnboardingLayoutRoute() {
  return (
    <OnboardingChrome>
      <Outlet />
    </OnboardingChrome>
  );
}

function OnboardingError() {
  const router = useRouter();
  return (
    <OnboardingChrome>
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-heading-lg text-foreground">Cette étape n'a pas pu s'afficher</h1>
        <p className="text-body mt-3 text-muted-foreground">
          Nous n'avons pas pu charger vos informations pour le moment. Réessayez dans un instant.
        </p>
        <Button className="mt-6 touch-target" onClick={() => void router.invalidate()}>
          Réessayer
        </Button>
      </div>
    </OnboardingChrome>
  );
}
