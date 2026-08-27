import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostLoginRoute } from "@/features/auth/lib/post-login";

/**
 * Public authentication callback (§26).
 * Waits for the session to be hydrated, then routes according to trusted
 * server-side customer state.
 */
export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Connexion en cours — Vaultis" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function resolve() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        setFailed(true);
        return;
      }
      const target = await resolvePostLoginRoute(redirect);
      if (active) await navigate({ to: target, replace: true });
    }

    void resolve();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void resolve();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate, redirect]);

  if (failed) {
    return (
      <AuthShell
        title="Connexion incomplète"
        description="Nous n'avons pas pu finaliser votre connexion. Réessayez depuis la page de connexion."
      >
        <Button className="w-full touch-target" onClick={() => void navigate({ to: "/login" })}>
          Retour à la connexion
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Connexion en cours" description="Nous préparons votre espace sécurisé.">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Spinner className="size-5" />
        <span className="text-body-sm">Un instant…</span>
      </div>
    </AuthShell>
  );
}
