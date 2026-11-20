import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/email-verified")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Adresse e-mail confirmée — RFC FINANCE Bank" },
      { name: "description", content: "Votre adresse e-mail est confirmée." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EmailVerifiedPage,
});

/** A single-purpose confirmation page; remaining profile steps live in the customer space. */
function EmailVerifiedPage() {
  const { language } = useLanguage();
  const en = language === "en";

  return (
    <AuthShell
      eyebrow={en ? "EMAIL CONFIRMATION" : "CONFIRMATION DE L’E-MAIL"}
      title={en ? "Your email is confirmed" : "Votre adresse e-mail est confirmée"}
      description={
        en
          ? "Your sign-up access is ready. Complete the rest of your profile from your customer space."
          : "Votre accès est créé. Vous pourrez compléter le reste de votre profil depuis votre espace client."
      }
      aside={
        <div className="space-y-3 rounded-2xl border border-brand/15 bg-brand/5 p-4 sm:p-5">
          <ShieldCheck className="size-6 text-brand" aria-hidden="true" />
          <h2 className="text-heading-sm font-semibold text-foreground">
            {en ? "Your account stays protected" : "Votre compte reste protégé"}
          </h2>
          <p className="text-body-sm leading-relaxed text-muted-foreground">
            {en
              ? "Email confirmation alone does not activate banking transactions. Required identity and compliance checks remain separate."
              : "La confirmation de l’e-mail ne donne pas accès aux opérations bancaires. Les vérifications d’identité et de conformité restent distinctes."}
          </p>
        </div>
      }
    >
      <div className="space-y-5">
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success-muted p-4 sm:p-5"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-label font-semibold text-foreground">
              {en ? "Confirmation completed" : "Confirmation terminée"}
            </p>
            <p className="mt-1 text-body-sm text-muted-foreground">
              {en
                ? "You can now access your customer space and complete the information still needed."
                : "Vous pouvez maintenant accéder à votre espace client et compléter les informations encore nécessaires."}
            </p>
          </div>
        </div>

        <Button asChild className="w-full touch-target">
          <Link to="/app">
            {en ? "Go to my customer space" : "Accéder à mon espace client"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
