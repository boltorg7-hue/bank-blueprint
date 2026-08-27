import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { publicMeta } from "@/features/public/lib/seo";

const meta = publicMeta({
  title: "Mot de passe oublié",
  description: "Recevez un lien sécurisé pour définir un nouveau mot de passe Vaultis.",
  path: "/forgot-password",
});

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    ...meta,
    meta: [...meta.meta, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Indiquez votre adresse e-mail : nous vous enverrons un lien pour définir un nouveau mot de passe."
      footer={
        <p className="text-body-sm text-muted-foreground">
          <Link to="/login" className="text-brand underline-offset-4 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
