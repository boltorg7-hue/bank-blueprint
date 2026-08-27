import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { publicMeta } from "@/features/public/lib/seo";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";

const meta = publicMeta({
  title: "Ouvrir un compte",
  description:
    "Créez votre compte en quelques minutes : informations essentielles, confirmation de votre e-mail, puis vérification d'identité en ligne.",
  path: "/register",
});

export const Route = createFileRoute("/register")({
  head: () => meta,
  component: RegisterPage,
});

function RegisterPage() {
  const [oauthError, setOauthError] = useState<string | null>(null);

  return (
    <AuthShell
      title="Ouvrir un compte"
      description="Commencez par l'essentiel. Les informations réglementaires sont demandées ensuite, étape par étape."
      aside={
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-caption text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleSignInButton onError={setOauthError} />
          {oauthError ? (
            <p role="alert" className="text-caption text-destructive">
              {oauthError}
            </p>
          ) : null}
        </div>
      }
      footer={
        <p className="text-body-sm text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="text-brand underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
