import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostLoginRoute } from "@/features/auth/lib/post-login";
import { checkConfirmationLink } from "@/features/auth/services/email-confirmation.functions";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Public authentication callback (§26).
 * Waits for the session to be hydrated, then routes according to trusted
 * server-side customer state.
 */
export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { redirect?: string; next?: string; v?: string } => ({
    ...(typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {}),
    ...(typeof search["next"] === "string" ? { next: search["next"] } : {}),
    ...(typeof search["v"] === "string" ? { v: search["v"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Connexion en cours — RFC" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { redirect, next, v } = Route.useSearch();
  const [failed, setFailed] = useState(false);
  const [stale, setStale] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    let active = true;

    async function resolve() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        setFailed(true);
        return;
      }
      const isConfirmation = next === "verified" || /type=signup/.test(window.location.hash);
      if (isConfirmation) {
        let check: { valid: boolean };
        try {
          check = await checkConfirmationLink({ data: { nonce: v } });
        } catch {
          await supabase.auth.signOut();
          if (!active) return;
          setFailed(true);
          return;
        }
        if (!active) return;
        if (!check.valid) {
          await supabase.auth.signOut();
          setStale(true);
          return;
        }
        await navigate({ to: "/email-verified", replace: true });
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
  }, [navigate, redirect, next, v]);

  if (stale) {
    return (
      <AuthShell
        title={language === "en" ? "Link expired" : "Lien expiré"}
        description={language === "en" ? "This link was replaced by a newer one. Use the latest email you received." : "Ce lien a été remplacé par un envoi plus récent. Utilisez le dernier e-mail reçu."}
      >
        <Button className="w-full touch-target" onClick={() => void navigate({ to: "/verify-email" })}>
          {language === "en" ? "Get a new link" : "Recevoir un nouveau lien"}
        </Button>
      </AuthShell>
    );
  }

  if (failed) {
    return (
      <AuthShell
        title={language === "en" ? "Incomplete sign-in" : "Connexion incomplète"}
        description={language === "en" ? "We could not complete your sign-in. Please try again from the sign-in page." : "Nous n'avons pas pu finaliser votre connexion. Réessayez depuis la page de connexion."}
      >
        <Button className="w-full touch-target" onClick={() => void navigate({ to: "/login" })}>
          {language === "en" ? "Back to sign-in" : "Retour à la connexion"}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={language === "en" ? "Signing you in" : "Connexion en cours"} description={language === "en" ? "We are preparing your secure banking space." : "Nous préparons votre espace sécurisé."}>
      <div className="flex items-center gap-3 text-muted-foreground">
        <Spinner className="size-5" />
        <span className="text-body-sm">{language === "en" ? "One moment…" : "Un instant…"}</span>
      </div>
    </AuthShell>
  );
}
