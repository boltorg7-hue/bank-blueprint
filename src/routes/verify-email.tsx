import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { maskEmail } from "@/features/auth/lib/auth-errors";
import { publicMeta } from "@/features/public/lib/seo";

const meta = publicMeta({
  title: "Confirmez votre adresse e-mail",
  description: "Confirmez votre adresse e-mail pour continuer l'ouverture de votre compte Vaultis.",
  path: "/verify-email",
});

const RESEND_COOLDOWN_SECONDS = 60;

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search["email"] === "string" ? search["email"] : undefined,
  }),
  head: () => ({
    ...meta,
    meta: [...meta.meta, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = Route.useSearch();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setSessionEmail(data.user?.email ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const target = email ?? sessionEmail;

  async function handleResend() {
    if (!target) return;
    setPending(true);
    await supabase.auth.resend({
      type: "signup",
      email: target,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setPending(false);
    setNotice("Si une confirmation est encore nécessaire, un nouvel e-mail vient d'être envoyé.");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <AuthShell
      title="Vérifiez votre messagerie"
      description={
        target
          ? `Nous avons envoyé un lien de confirmation à ${maskEmail(target)}.`
          : "Nous avons envoyé un lien de confirmation à votre adresse e-mail."
      }
    >
      <div className="space-y-5">
        <p className="text-body-sm flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-muted-foreground">
          <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Ouvrez le lien depuis cet appareil si possible. Pensez à consulter vos courriers
          indésirables.
        </p>

        {notice ? (
          <p role="status" className="text-body-sm text-foreground">
            {notice}
          </p>
        ) : null}

        <Button
          type="button"
          className="w-full touch-target"
          loading={pending}
          disabled={!target || cooldown > 0}
          onClick={() => void handleResend()}
        >
          {cooldown > 0 ? `Nouvel envoi possible dans ${cooldown} s` : "Renvoyer l'e-mail"}
        </Button>

        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" className="touch-target">
            <Link to="/register">Modifier mon adresse e-mail</Link>
          </Button>
          <Button asChild variant="ghost" className="touch-target">
            <Link to="/login">Retour à la connexion</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
