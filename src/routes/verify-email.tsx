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
import { useServerFn } from "@tanstack/react-start";
import {
  changePendingEmail,
  resendConfirmationEmail,
} from "@/features/auth/services/email-confirmation.functions";

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
  const [password, setPassword] = useState("");
  const [overrideEmail, setOverrideEmail] = useState<string | null>(null);
  const resendFn = useServerFn(resendConfirmationEmail);
  const changeFn = useServerFn(changePendingEmail);
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

  const target = overrideEmail ?? sessionEmail ?? email;

  function rateMessage(seconds?: number) {
    const wait = seconds && seconds > 90 ? Math.ceil(seconds / 60) : null;
    return en
      ? wait ? `Too many requests. Try again in ${wait} min.` : "Too many requests. Please wait a minute and try again."
      : wait ? `Trop de demandes. Réessayez dans ${wait} min.` : "Trop de demandes. Patientez une minute puis réessayez.";
  }

  async function handleResend() {
    if (!target) return;
    setPending(true);
    try {
      const result = await resendFn({ data: { email: target } });
      if (result.ok) {
        setCooldown(result.retryAfter);
        setNotice({ tone: "ok", text: en
          ? `A new link has been sent. Previous links no longer work. ${result.remaining} resend(s) left this hour.`
          : `Un nouveau lien a été envoyé. Les liens précédents ne fonctionnent plus. ${result.remaining} renvoi(s) restant(s) cette heure.` });
      } else if (result.code === "RATE_LIMITED") {
        setCooldown(result.retryAfter ?? RESEND_COOLDOWN_SECONDS);
        setNotice({ tone: "error", text: rateMessage(result.retryAfter) });
      } else if (result.code === "ALREADY_VERIFIED") {
        setNotice({ tone: "ok", text: en ? "This address is already verified. Sign in to continue." : "Cette adresse est déjà vérifiée. Connectez-vous pour continuer." });
      } else {
        setNotice({ tone: "error", text: en ? "The email could not be sent. Try again later." : "L’e-mail n’a pas pu être envoyé. Réessayez plus tard." });
      }
    } catch {
      setNotice({ tone: "error", text: en ? "The email could not be sent. Try again later." : "L’e-mail n’a pas pu être envoyé. Réessayez plus tard." });
    } finally {
      setPending(false);
    }
  }

  async function handleChangeEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setNotice({ tone: "error", text: en ? "Please enter a valid email address." : "Saisissez une adresse e-mail valide." });
      return;
    }
    if (target && value === target.toLowerCase()) {
      setNotice({ tone: "error", text: en ? "This is already your current address." : "C’est déjà votre adresse actuelle." });
      return;
    }
    if (!target) {
      void navigate({ to: "/register" });
      return;
    }
    setSavingEmail(true);
    let result;
    try {
      result = await changeFn({ data: { currentEmail: target, newEmail: value, password } });
    } catch {
      result = { ok: false as const, code: "SEND_FAILED" as const };
    }
    setSavingEmail(false);
    if (!result.ok) {
      const messages: Record<string, [string, string]> = {
        AUTH_FAILED: ["Mot de passe incorrect.", "Incorrect password."],
        EMAIL_TAKEN: ["Cette adresse est déjà utilisée.", "This address is already in use."],
        ALREADY_VERIFIED: ["Votre adresse est déjà vérifiée : modifiez-la depuis votre espace sécurité.", "Your address is already verified: change it from your security settings."],
        INVALID: ["C’est déjà votre adresse actuelle.", "This is already your current address."],
        SEND_FAILED: ["La modification a échoué. Réessayez plus tard.", "The change failed. Try again later."],
      };
      const text = result.code === "RATE_LIMITED" ? rateMessage(result.retryAfter) : (messages[result.code] ?? messages.SEND_FAILED)![en ? 1 : 0];
      setNotice({ tone: "error", text });
      return;
    }
    setOverrideEmail(value);
    setEditing(false);
    setNewEmail("");
    setPassword("");
    setCooldown(result.retryAfter);
    setNotice({
      tone: "ok",
      text: en
        ? `A confirmation link has been sent to ${maskEmail(value)}. Links sent to your previous address are no longer valid.`
        : `Un lien de confirmation a été envoyé à ${maskEmail(value)}. Les liens envoyés à l’ancienne adresse ne sont plus valables.`,
    });
    void checkStatus();
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
            <Link to="/email-verified">{en ? "Continue my account opening" : "Continuer mon ouverture de compte"}</Link>
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

        {!verified ? (
          editing ? (
            <form onSubmit={(event) => void handleChangeEmail(event)} className="space-y-3 rounded-xl border border-border bg-surface p-4">
              <Label htmlFor="new-email">{en ? "New email address" : "Nouvelle adresse e-mail"}</Label>
              <Input
                id="new-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoFocus
                required
                className="touch-target"
                placeholder={en ? "you@example.com" : "vous@exemple.com"}
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
              />
              <Label htmlFor="confirm-password">{en ? "Your password" : "Votre mot de passe"}</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="current-password"
                required
                className="touch-target"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="text-caption text-muted-foreground">
                {en
                  ? "We'll send a new link to this address. Links sent before will stop working."
                  : "Nous enverrons un nouveau lien à cette adresse. Les liens envoyés auparavant ne fonctionneront plus."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="w-full touch-target" loading={savingEmail}>
                  {en ? "Save and send the link" : "Enregistrer et envoyer le lien"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full touch-target"
                  onClick={() => {
                    setEditing(false);
                    setNewEmail("");
                  }}
                >
                  {en ? "Cancel" : "Annuler"}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="w-full touch-target"
              onClick={() => {
                setNotice(null);
                setNewEmail(target ?? "");
                setEditing(true);
              }}
            >
              <PencilLine className="size-4" aria-hidden="true" />
              {en ? "Wrong address? Change my email" : "Adresse incorrecte ? Modifier mon e-mail"}
            </Button>
          )
        ) : null}

        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" className="touch-target">
            <Link to="/login">{en ? "Back to sign in" : "Retour à la connexion"}</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
