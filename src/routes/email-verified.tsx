import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";

export const Route = createFileRoute("/email-verified")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Adresse e-mail confirmée — RFC FINANCE Bank" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EmailVerifiedPage,
});

function EmailVerifiedPage() {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <AuthShell
      eyebrow={en ? "EMAIL CONFIRMATION" : "CONFIRMATION E-MAIL"}
      title={en ? "Your email is confirmed" : "Votre adresse e-mail est confirmée"}
      description={en
        ? "Your email confirmation is complete. You can now access your customer dashboard."
        : "La confirmation de votre e-mail est terminée. Vous pouvez maintenant accéder à votre espace client."}
    >
      <div className="space-y-5">
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success-muted p-4 sm:p-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <p className="font-semibold text-foreground">{en ? "Email verified successfully" : "E-mail vérifié avec succès"}</p>
            <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
              {en ? "Phone, address, personal details and identity documents can be managed later from the Account section of your dashboard. Certain banking operations remain subject to verification." : "Le téléphone, l’adresse, les informations personnelles et les justificatifs pourront être gérés ensuite depuis la rubrique Compte du tableau de bord. Certaines opérations bancaires restent soumises aux vérifications."}
            </p>
          </div>
        </div>
        <Button asChild className="w-full touch-target">
          <Link to="/app/dashboard">
            {en ? "Open my dashboard" : "Accéder à mon tableau de bord"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
