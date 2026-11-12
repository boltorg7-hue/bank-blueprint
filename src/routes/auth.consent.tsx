import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileCheck2, LockKeyhole, ShieldCheck, Sparkles, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { areOAuthConsentDocumentsPublished } from "@/features/public/content/legal";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostLoginRoute } from "@/features/auth/lib/post-login";
import {
  getOAuthConsentStatus,
  recordOAuthConsent,
} from "@/features/auth/services/oauth-consent.functions";

export const Route = createFileRoute("/auth/consent")({
  ssr: false,
  beforeLoad: async () => {
    const status = await getOAuthConsentStatus();
    if (!status.required) {
      const target = await resolvePostLoginRoute();
      throw redirect({ to: target, replace: true });
    }
  },
  head: () => ({
    meta: [
      { title: "Consentement requis — RF BANK" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OAuthConsentPage,
});

function OAuthConsentPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const navigate = useNavigate();
  const saveConsent = useServerFn(recordOAuthConsent);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const documentsPublished = areOAuthConsentDocumentsPublished();

  async function handleContinue() {
    if (!documentsPublished || !termsAccepted || !privacyAccepted || pending) return;

    setPending(true);
    setError(null);
    try {
      await saveConsent({
        data: {
          termsAccepted: true,
          privacyAccepted: true,
          marketingConsent,
        },
      });
      const target = await resolvePostLoginRoute();
      await navigate({ to: target, replace: true });
    } catch {
      setError(
        en
          ? "We could not securely record your consent. Please try again."
          : "Nous n’avons pas pu enregistrer votre consentement de manière sécurisée. Réessayez.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleLeave() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      await navigate({ to: "/login", replace: true });
    } catch {
      setError(en ? "We could not safely sign you out. Please try again." : "La déconnexion sécurisée a échoué. Veuillez réessayer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      eyebrow={en ? "A secure start" : "Un début en toute sécurité"}
      title={en ? "Before you continue" : "Avant de poursuivre"}
      description={
        en
          ? "A few clear choices before we prepare your RF BANK account."
          : "Quelques choix essentiels avant de préparer votre espace RF BANK."
      }
    >
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/[0.09] via-surface to-surface-sunken p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {en ? "Google or Apple sign-in completed" : "Connexion Google ou Apple réussie"}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {en
                  ? "This confirms access to your Google or Apple account only. It is not bank identity verification (KYC), does not approve your documents and does not activate banking services."
                  : "Cette étape confirme uniquement l’accès à votre compte Google ou Apple. Elle ne constitue pas une vérification d’identité bancaire (KYC), ne valide pas vos documents et n’active aucun service bancaire."}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-brand/10 pt-3 text-xs font-medium text-muted-foreground">
            <LockKeyhole className="size-3.5 text-brand" aria-hidden="true" />
            {en
              ? "Your choices are recorded securely before onboarding."
              : "Vos choix sont enregistrés de manière sécurisée avant l’ouverture du compte."}
          </div>
        </div>

        {!documentsPublished ? (
          <div role="alert" className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {en ? "Consent is temporarily unavailable" : "Validation temporairement indisponible"}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {en
                  ? "The official Terms and Privacy Policy are not yet fully published. Their final text and publication dates are required before you can accept them. No consent will be recorded and you cannot continue onboarding yet."
                  : "Les Conditions générales et la Politique de confidentialité officielles ne sont pas encore intégralement publiées. Leur texte définitif et leur date de publication sont nécessaires avant toute acceptation. Aucun consentement ne sera enregistré et vous ne pouvez pas encore poursuivre l’inscription."}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {en ? "You may leave securely and return later when the documents are available." : "Vous pouvez quitter votre session en toute sécurité et revenir lorsque les documents seront disponibles."}
            </p>
          </div>
        ) : null}

        <section aria-labelledby="required-consents" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="required-consents" className="text-sm font-semibold text-foreground">
              {en ? "Required to continue" : "Nécessaire pour continuer"}
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {en ? "2 choices" : "2 accords"}
            </span>
          </div>

          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/30">
              <Checkbox
                id="oauth-terms"
                checked={termsAccepted}
                onCheckedChange={(value) => setTermsAccepted(value === true)}
                className="mt-0.5 size-5 rounded-md"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor="oauth-terms" className="cursor-pointer text-sm font-semibold leading-5">
                  {en ? "Terms and conditions" : "Conditions générales"}
                </Label>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {en ? "I agree to the rules governing the use of RF BANK." : "J’accepte les règles qui encadrent l’utilisation de RF BANK."}{" "}
                  <Link
                    to="/terms"
                    className="font-semibold text-brand underline underline-offset-4 hover:text-brand/80"
                  >
                    {en ? "Read the terms" : "Lire les conditions"}
                  </Link>
                </p>
              </div>
              <FileCheck2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </div>

            <div className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/30">
              <Checkbox
                id="oauth-privacy"
                checked={privacyAccepted}
                onCheckedChange={(value) => setPrivacyAccepted(value === true)}
                className="mt-0.5 size-5 rounded-md"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor="oauth-privacy" className="cursor-pointer text-sm font-semibold leading-5">
                  {en ? "Privacy policy" : "Politique de confidentialité"}
                </Label>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {en
                    ? "I have read how my personal information is handled."
                    : "J’ai pris connaissance de la manière dont mes données personnelles sont traitées."}{" "}
                  <Link
                    to="/privacy"
                    className="font-semibold text-brand underline underline-offset-4 hover:text-brand/80"
                  >
                    {en ? "Read the policy" : "Lire la politique"}
                  </Link>
                </p>
              </div>
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface-sunken/70 p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="oauth-marketing"
              checked={marketingConsent}
              onCheckedChange={(value) => setMarketingConsent(value === true)}
              className="mt-0.5 size-5 rounded-md"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="oauth-marketing" className="cursor-pointer text-sm font-semibold">
                  {en ? "News and offers" : "Actualités et offres"}
                </Label>
                <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {en ? "Optional" : "Facultatif"}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {en
                  ? "I would like to receive updates and offers from RF BANK. I can change this choice later."
                  : "Je souhaite recevoir les actualités et offres de RF BANK. Je pourrai modifier ce choix ultérieurement."}
              </p>
            </div>
            <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>
        </section>

        {error ? (
          <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="space-y-3 pt-1">
          <Button
            type="button"
            variant="brand"
            size="block"
            loading={pending}
            disabled={!documentsPublished || !termsAccepted || !privacyAccepted || pending}
            onClick={() => void handleContinue()}
            className="rounded-xl shadow-md shadow-brand/15"
          >
            {en ? "Accept and continue" : "Accepter et continuer"}
          </Button>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            {en
              ? "After consent, you will continue through the required profile, contact, address, document and KYC checks. Banking access remains subject to review and approval."
              : "Après les consentements, vous poursuivrez les étapes du profil, des coordonnées, de l’adresse, des documents et du contrôle KYC. L’accès bancaire restera soumis à vérification et approbation."}
          </p>
          <Button type="button" variant="outline" size="block" disabled={pending} onClick={() => void handleLeave()} className="rounded-xl">
            <LogOut className="mr-2 size-4" aria-hidden="true" />
            {en ? "Leave and sign out" : "Quitter et me déconnecter"}
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
