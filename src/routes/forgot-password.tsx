import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { publicMeta } from "@/features/public/lib/seo";

const meta = publicMeta({
  title: "Mot de passe oublié",
  description: "Recevez un lien sécurisé pour définir un nouveau mot de passe RFC.",
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
  const { language } = useLanguage();
  const en = language === "en";

  return (
    <AuthShell
      eyebrow={en ? "ACCOUNT RECOVERY" : "RÉCUPÉRATION DU COMPTE"}
      title={en ? "Forgot password" : "Mot de passe oublié"}
      description={
        en
          ? "Enter your email address and we will send you a link to set a new password."
          : "Indiquez votre adresse e-mail : nous vous enverrons un lien pour définir un nouveau mot de passe."
      }
      footer={
        <p className="text-body-sm text-muted-foreground">
          <Link
            to="/login"
            className="inline-flex min-h-10 items-center rounded-lg font-medium text-brand underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            {en ? "Back to sign in" : "Retour à la connexion"}
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-surface-sunken p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <MailCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-body-sm font-semibold text-foreground">
              {en ? "A secure recovery link" : "Un lien de récupération sécurisé"}
            </p>
            <p className="text-caption leading-relaxed text-muted-foreground">
              {en
                ? "For your security, the confirmation message does not disclose whether an account exists for this email address."
                : "Pour votre sécurité, le message de confirmation ne révèle pas si un compte existe pour cette adresse e-mail."}
            </p>
          </div>
        </div>
        <ForgotPasswordForm />
      </div>
    </AuthShell>
  );
}
