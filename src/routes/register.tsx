import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CheckCircle2, LockKeyhole } from "lucide-react";

import { publicMeta } from "@/features/public/lib/seo";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { AppleSignInButton } from "@/features/auth/components/AppleSignInButton";
import { useLanguage } from "@/components/providers/LanguageProvider";

const meta = publicMeta({
  title: "Ouvrir un compte",
  description:
    "Créez votre compte RF BANK : informations essentielles, confirmation de votre e-mail, puis vérification d'identité étape par étape.",
  path: "/register",
});

export const Route = createFileRoute("/register")({
  head: () => meta,
  component: RegisterPage,
});

function RegisterPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthPending, setOauthPending] = useState(false);
  const oauthLock = useRef(false);

  function startOAuth() {
    if (oauthLock.current) return false;
    oauthLock.current = true;
    setOauthError(null);
    setOauthPending(true);
    return true;
  }

  function handleOauthError(message: string) {
    oauthLock.current = false;
    setOauthPending(false);
    setOauthError(message);
  }

  return (
    <AuthShell
      wide
      eyebrow={en ? "WELCOME TO RF BANK" : "BIENVENUE CHEZ RF BANK"}
      title={en ? "Your banking journey starts here" : "Votre parcours bancaire commence ici"}
      description={
        en
          ? "Create your access in a few steps. Your identity and banking details will be verified progressively."
          : "Créez votre accès en quelques étapes. Votre identité et vos informations bancaires seront vérifiées progressivement."
      }
      aside={
        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-heading-sm text-foreground">
              {en ? "Choose another way" : "Choisissez une autre méthode"}
            </h2>
            <p className="text-body-sm text-muted-foreground">
              {en
                ? "Use a trusted identity provider to continue."
                : "Utilisez un fournisseur d'identité pour continuer."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-caption text-muted-foreground">
              {en ? "QUICK SIGN-UP" : "INSCRIPTION RAPIDE"}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <GoogleSignInButton
              disabled={oauthPending}
              onStart={startOAuth}
              onError={handleOauthError}
            />
            <AppleSignInButton
              disabled={oauthPending}
              onStart={startOAuth}
              onError={handleOauthError}
            />
          </div>

          {oauthError ? (
            <p
              role="alert"
              className="text-caption rounded-lg bg-destructive/10 px-3 py-2 text-destructive"
            >
              {oauthError}
            </p>
          ) : null}

          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
              <p className="text-body-sm text-muted-foreground">
                {en ? "Your sign-in details stay protected." : "Vos identifiants restent protégés."}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
              <p className="text-body-sm text-muted-foreground">
                {en
                  ? "Identity checks are completed before banking access is activated."
                  : "Les vérifications d'identité sont effectuées avant l'activation de l'accès bancaire."}
              </p>
            </div>
          </div>
        </div>
      }
      footer={
        <p className="text-body-sm text-muted-foreground">
          {en ? "Already have an account?" : "Vous avez déjà un compte ?"}{" "}
          <Link to="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
            {en ? "Sign in" : "Se connecter"}
          </Link>
        </p>
      }
    >
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-overline text-brand">{en ? "STEP 1 OF 3" : "ÉTAPE 1 SUR 3"}</span>
          <span className="text-caption text-muted-foreground">
            {en ? "3 secure steps" : "3 étapes sécurisées"}
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-label={en ? "Registration progress" : "Progression de l'inscription"}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={1}
        >
          <div className="h-full w-1/3 rounded-full bg-brand" />
        </div>
        <h2 className="text-heading-sm text-foreground">
          {en ? "Your personal details" : "Vos informations personnelles"}
        </h2>
        <p className="text-body-sm text-muted-foreground">
          {en
            ? "Start with your name, email and a strong password."
            : "Commencez par votre nom, votre e-mail et un mot de passe robuste."}
        </p>
      </div>
      <RegisterForm />
    </AuthShell>
  );
}
