import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getOAuthConsentStatus, recordOAuthConsent } from "@/features/auth/services/oauth-consent.functions";
import { resolvePostLoginRoute } from "@/features/auth/lib/post-login";
import { useLanguage } from "@/components/providers/LanguageProvider";

export const Route = createFileRoute("/auth/consent")({
  ssr: false,
  beforeLoad: async () => {
    const status = await getOAuthConsentStatus();
    if (!status.required) throw redirect({ to: "/onboarding", replace: true });
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

  async function handleContinue() {
    if (!termsAccepted || !privacyAccepted || pending) return;
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
      setError(en
        ? "We could not securely record your consent. Please try again."
        : "Nous n’avons pas pu enregistrer votre consentement de manière sécurisée. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title={en ? "Before you continue" : "Avant de poursuivre"}
      description={en
        ? "Please review and accept the terms and privacy policy before starting your account onboarding."
        : "Veuillez lire et accepter les conditions et la politique de confidentialité avant de commencer votre parcours d’ouverture de compte."}
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-surface-sunken p-4">
          <p className="text-body-sm text-muted-foreground">
            {en
              ? "Your Google or Apple identity has been authenticated. This does not activate a bank account or grant access to banking services. We will record your consent securely before allowing onboarding."
              : "Votre identité Google ou Apple a été authentifiée. Cela n’active pas un compte bancaire et ne donne pas accès aux services bancaires. Votre consentement sera enregistré de manière sécurisée avant de poursuivre."}
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-border p-4">
          <div className="flex items-start gap-3">
            <Checkbox id="oauth-terms" checked={termsAccepted} onCheckedChange={(value) => setTermsAccepted(value === true)} />
            <Label htmlFor="oauth-terms" className="text-body-sm leading-relaxed font-normal">
              {en ? "I accept the" : "J’accepte les"}{" "}
              <Link to="/terms" className="font-medium text-brand underline-offset-4 hover:underline">
                {en ? "terms and conditions" : "conditions générales"}
              </Link>.
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox id="oauth-privacy" checked={privacyAccepted} onCheckedChange={(value) => setPrivacyAccepted(value === true)} />
            <Label htmlFor="oauth-privacy" className="text-body-sm leading-relaxed font-normal">
              {en ? "I have read and accept the" : "J’ai lu et j’accepte la"}{" "}
              <Link to="/privacy" className="font-medium text-brand underline-offset-4 hover:underline">
                {en ? "privacy policy" : "politique de confidentialité"}
              </Link>.
            </Label>
          </div>
          <div className="flex items-start gap-3 border-t border-border pt-3">
            <Checkbox id="oauth-marketing" checked={marketingConsent} onCheckedChange={(value) => setMarketingConsent(value === true)} />
            <Label htmlFor="oauth-marketing" className="text-body-sm leading-relaxed font-normal">
              {en
                ? "I would like to receive RF BANK news and offers (optional)."
                : "Je souhaite recevoir les actualités et offres de RF BANK (facultatif)."}
            </Label>
          </div>
        </div>

        {error ? <p role="alert" className="text-body-sm text-destructive">{error}</p> : null}
        <Button
          type="button"
          className="w-full touch-target"
          loading={pending}
          disabled={!termsAccepted || !privacyAccepted || pending}
          onClick={() => void handleContinue()}
        >
          {en ? "Accept and continue" : "Accepter et continuer"}
        </Button>
        <p className="text-caption text-center text-muted-foreground">
          {en
            ? "Marketing consent is optional and can be changed later."
            : "Le consentement marketing est facultatif et pourra être modifié ultérieurement."}
        </p>
      </div>
    </AuthShell>
  );
}
