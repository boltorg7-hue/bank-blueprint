import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, LockKeyhole, MailCheck } from "lucide-react";

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
  validateSearch: (
    search: Record<string, unknown>,
  ): { redirect?: string; next?: string; v?: string } => ({
    ...(typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {}),
    ...(typeof search["next"] === "string" ? { next: search["next"] } : {}),
    ...(typeof search["v"] === "string" ? { v: search["v"] } : {}),
  }),
  head: () => ({
    meta: [{ title: "Connexion en cours — RFC" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { redirect, next, v } = Route.useSearch();
  const [failed, setFailed] = useState(false);
  const [stale, setStale] = useState(false);
  const { language } = useLanguage();
  const en = language === "en";

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
        eyebrow={en ? "Email verification" : "Vérification de l’e-mail"}
        title={en ? "Link expired" : "Lien expiré"}
        description={
          en
            ? "This link was replaced by a newer one. Use the latest email you received."
            : "Ce lien a été remplacé par un envoi plus récent. Utilisez le dernier e-mail reçu."
        }
      >
        <div className="space-y-5" role="alert">
          <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-label font-semibold text-foreground">
                {en ? "For your security" : "Pour votre sécurité"}
              </p>
              <p className="text-body-sm leading-relaxed text-muted-foreground">
                {en
                  ? "Only the most recently issued verification link can be used."
                  : "Seul le lien de vérification le plus récemment envoyé peut être utilisé."}
              </p>
            </div>
          </div>
          <Button
            className="w-full touch-target"
            onClick={() => void navigate({ to: "/verify-email" })}
          >
            {en ? "Get a new link" : "Recevoir un nouveau lien"}
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (failed) {
    return (
      <AuthShell
        eyebrow={en ? "Secure sign-in" : "Connexion sécurisée"}
        title={en ? "Incomplete sign-in" : "Connexion incomplète"}
        description={
          en
            ? "We could not complete your sign-in. Please try again from the sign-in page."
            : "Nous n'avons pas pu finaliser votre connexion. Réessayez depuis la page de connexion."
        }
      >
        <div className="space-y-5" role="alert">
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-label font-semibold text-foreground">
                {en ? "Your account remains protected" : "Votre compte reste protégé"}
              </p>
              <p className="text-body-sm leading-relaxed text-muted-foreground">
                {en
                  ? "No banking access was opened. Start a new sign-in to continue."
                  : "Aucun accès bancaire n’a été ouvert. Relancez une connexion pour continuer."}
              </p>
            </div>
          </div>
          <Button className="w-full touch-target" onClick={() => void navigate({ to: "/login" })}>
            {en ? "Back to sign-in" : "Retour à la connexion"}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={en ? "Secure sign-in" : "Connexion sécurisée"}
      title={en ? "Signing you in" : "Connexion en cours"}
      description={en ? "We are preparing your secure banking space." : "Nous préparons votre espace sécurisé."}
    >
      <div className="space-y-5" role="status" aria-live="polite">
        <div className="flex items-center gap-3 rounded-2xl border border-brand/15 bg-brand/5 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <Spinner className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-label font-semibold text-foreground">
              {en ? "Verifying your secure session" : "Vérification de votre session sécurisée"}
            </p>
            <p className="text-body-sm text-muted-foreground">
              {en ? "One moment…" : "Un instant…"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-caption text-muted-foreground">
          {en ? (
            <>
              <LockKeyhole className="size-4 shrink-0" aria-hidden="true" />
              <span>Your credentials are protected during this step.</span>
            </>
          ) : (
            <>
              <MailCheck className="size-4 shrink-0" aria-hidden="true" />
              <span>Vos informations restent protégées pendant cette étape.</span>
            </>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
