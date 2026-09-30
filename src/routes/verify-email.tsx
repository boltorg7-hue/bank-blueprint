import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, MailCheck, PencilLine, RefreshCw } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { maskEmail, signUpErrorMessage } from "@/features/auth/lib/auth-errors";
import { publicMeta } from "@/features/public/lib/seo";

const meta = publicMeta({
  title: "Confirmez votre adresse e-mail",
  description: "Confirmez votre adresse e-mail pour continuer l'ouverture de votre compte RFC.",
  path: "/verify-email",
});

const RESEND_COOLDOWN_SECONDS = 60;

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): { email?: string } =>
    typeof search["email"] === "string" ? { email: search["email"] } : {},
  head: () => ({
    ...meta,
    meta: [...meta.meta, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email } = Route.useSearch();
  const { language } = useLanguage();
  const en = language === "en";
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const navigate = useNavigate();

  const checkStatus = useCallback(async () => {
    setChecking(true);
    await supabase.auth.refreshSession().catch(() => undefined);
    const { data } = await supabase.auth.getUser();
    setSessionEmail(data.user?.email ?? null);
    setVerified(data.user ? Boolean(data.user.email_confirmed_at) : null);
    setChecking(false);
  }, []);

  useEffect(() => {
    void checkStatus();
    const onFocus = () => void checkStatus();
    window.addEventListener("focus", onFocus);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") void checkStatus();
    });
    return () => {
      window.removeEventListener("focus", onFocus);
      data.subscription.unsubscribe();
    };
  }, [checkStatus]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const target = email ?? sessionEmail;

  async function handleResend() {
    if (!target) return;
    setPending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: target,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setPending(false);
    if (error && /rate|seconds|429/i.test(error.message)) {
      setNotice({ tone: "error", text: en ? "Too many requests. Please wait a minute and try again." : "Trop de demandes. Patientez une minute puis réessayez." });
    } else {
      setNotice({ tone: "ok", text: en ? "If a confirmation is still needed, a new email has just been sent." : "Si une confirmation est encore nécessaire, un nouvel e-mail vient d'être envoyé." });
    }
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  const statusCard =
    verified === true ? (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-success/40 bg-success-muted px-4 py-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
        <div>
          <p className="text-label text-foreground">{en ? "Email verified" : "E-mail vérifié"}</p>
          <p className="text-body-sm text-muted-foreground">{en ? "You can continue opening your account." : "Vous pouvez poursuivre l’ouverture de votre compte."}</p>
        </div>
      </div>
    ) : (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-label text-foreground">{en ? "Awaiting confirmation" : "En attente de confirmation"}</p>
          <p className="text-body-sm text-muted-foreground">
            {verified === null
              ? en ? "Sign in after clicking the link to see your status." : "Connectez-vous après avoir cliqué sur le lien pour voir votre statut."
              : en ? "Click the link in the email, then come back here." : "Cliquez sur le lien reçu, puis revenez ici."}
          </p>
        </div>
      </div>
    );

  return (
    <AuthShell
      title={verified ? (en ? "Your email is confirmed" : "Votre e-mail est confirmé") : en ? "Check your inbox" : "Vérifiez votre messagerie"}
      description={
        target
          ? `${en ? "Confirmation link sent to" : "Lien de confirmation envoyé à"} ${maskEmail(target)}.`
          : en ? "We sent a confirmation link to your email address." : "Nous avons envoyé un lien de confirmation à votre adresse e-mail."
      }
    >
      <div className="space-y-4">
        {statusCard}

        {verified ? (
          <Button asChild className="w-full touch-target">
            <Link to="/onboarding">{en ? "Continue my account opening" : "Continuer mon ouverture de compte"}</Link>
          </Button>
        ) : (
          <>
            <p className="text-body-sm flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-muted-foreground">
              <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {en ? "Open the link on this device if possible and check your spam folder." : "Ouvrez le lien depuis cet appareil si possible. Pensez à consulter vos courriers indésirables."}
            </p>

            {notice ? (
              <p role="status" className={`text-body-sm ${notice.tone === "error" ? "text-destructive" : "text-foreground"}`}>
                {notice.text}
              </p>
            ) : null}

            <Button
              type="button"
              className="w-full touch-target"
              loading={pending}
              disabled={!target || cooldown > 0}
              onClick={() => void handleResend()}
            >
              {cooldown > 0
                ? en ? `Resend available in ${cooldown} s` : `Nouvel envoi possible dans ${cooldown} s`
                : en ? "Resend confirmation email" : "Renvoyer l'e-mail de confirmation"}
            </Button>
            <Button type="button" variant="outline" className="w-full touch-target" loading={checking} onClick={() => void checkStatus()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              {en ? "I've confirmed — check my status" : "J’ai confirmé — vérifier mon statut"}
            </Button>
          </>
        )}

        <div className="flex flex-col gap-2">
          {!verified ? (
            <Button asChild variant="ghost" className="touch-target">
              <Link to="/register">{en ? "Change my email address" : "Modifier mon adresse e-mail"}</Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" className="touch-target">
            <Link to="/login">{en ? "Back to sign in" : "Retour à la connexion"}</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
