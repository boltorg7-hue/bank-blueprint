import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, ShieldCheck } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { publicMeta } from "@/features/public/lib/seo";

const meta = publicMeta({
  title: "Nouveau mot de passe",
  description: "Définissez un nouveau mot de passe pour votre espace RFC.",
  path: "/reset-password",
});

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    ...meta,
    meta: [...meta.meta, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { language } = useLanguage();
  const en = language === "en";

  return (
    <AuthShell
      eyebrow={en ? "ACCOUNT SECURITY" : "SÉCURITÉ DU COMPTE"}
      title={en ? "New password" : "Nouveau mot de passe"}
      description={
        en
          ? "Choose a strong password that you do not use on any other service."
          : "Choisissez un mot de passe robuste que vous n'utilisez sur aucun autre service."
      }
      aside={
        <aside className="rounded-2xl border border-brand/15 bg-brand/5 p-4 sm:p-5">
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-background text-brand shadow-sm">
            <KeyRound className="size-5" aria-hidden="true" />
          </div>
          <h2 className="text-heading-sm font-semibold text-foreground">
            {en ? "A safer password" : "Un mot de passe plus sûr"}
          </h2>
          <p className="text-body-sm mt-2 text-muted-foreground">
            {en
              ? "Use a unique passphrase and keep it private. Never share your password or reset link."
              : "Utilisez une phrase secrète unique et gardez-la confidentielle. Ne partagez jamais votre mot de passe ni votre lien de réinitialisation."}
          </p>
          <div className="mt-4 flex items-start gap-2 border-t border-brand/10 pt-3 text-caption text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
            <span>
              {en
                ? "Your password is updated through the secure account recovery session."
                : "Votre mot de passe est mis à jour via la session sécurisée de récupération du compte."}
            </span>
          </div>
        </aside>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
