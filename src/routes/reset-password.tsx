import { createFileRoute } from "@tanstack/react-router";
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
      title={en ? "New password" : "Nouveau mot de passe"}
      description={en ? "Choose a password you do not use on any other service." : "Choisissez un mot de passe que vous n'utilisez sur aucun autre service."}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
