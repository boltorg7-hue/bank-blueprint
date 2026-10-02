import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { publicMeta } from "@/features/public/lib/seo";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { AppleSignInButton } from "@/features/auth/components/AppleSignInButton";
import { useLanguage } from "@/components/providers/LanguageProvider";

const meta = publicMeta({
  title: "Connexion à votre espace",
  description:
    "Accédez à votre espace bancaire RFC avec votre adresse e-mail et votre mot de passe.",
  path: "/login",
});

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {},
  head: () => ({
    ...meta,
    meta: [...meta.meta, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const { redirect } = Route.useSearch();
  const [oauthError, setOauthError] = useState<string | null>(null);

  return (
    <AuthShell
      title={en ? "Sign in" : "Connexion"}
      description={en ? "Enter your credentials to access your account." : "Saisissez vos identifiants pour accéder à votre espace."}
      aside={
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-caption text-muted-foreground">{en ? "or" : "ou"}</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <GoogleSignInButton onError={setOauthError} />
            <AppleSignInButton onError={setOauthError} />
          </div>
          <p className="text-caption text-muted-foreground">
            {en
              ? "New customers continue through the same verification flow before banking access."
              : "Les nouveaux clients suivent le même parcours de vérification avant l’accès bancaire."}
          </p>
          {oauthError ? (
            <p role="alert" className="text-caption text-destructive">
              {oauthError}
            </p>
          ) : null}
        </div>
      }
      footer={
        <div className="flex flex-col gap-2">
          <Link
            to="/forgot-password"
            className="text-body-sm text-brand underline-offset-4 hover:underline"
          >
            {en ? "Forgot your password?" : "Mot de passe oublié ?"}
          </Link>
          <p className="text-body-sm text-muted-foreground">
            {en ? "New to RFC?" : "Pas encore client ?"}{" "}
            <Link to="/register" className="text-brand underline-offset-4 hover:underline">
              {en ? "Open an account" : "Ouvrir un compte"}
            </Link>
          </p>
        </div>
      }
    >
      <LoginForm redirectTo={redirect} />
    </AuthShell>
  );
}
