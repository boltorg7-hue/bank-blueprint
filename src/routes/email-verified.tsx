import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { nextOnboardingRoute } from "@/features/onboarding/lib/tasks";

export const Route = createFileRoute("/email-verified")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Adresse e-mail confirmée — RFC FINANCE Bank" },
      { name: "description", content: "Votre adresse e-mail est confirmée : découvrez les prochaines étapes de l'ouverture de votre compte." },
      { property: "og:title", content: "Adresse e-mail confirmée — RFC FINANCE Bank" },
      { property: "og:description", content: "Les prochaines étapes de l'ouverture de votre compte RFC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EmailVerifiedPage,
});

function EmailVerifiedPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const { data: context, isLoading: isPending } = useCustomerContext();

  const steps = en
    ? [
        ["Personal details", "Name, date of birth, nationality, residence and occupation — about 2 minutes."],
        ["Home address", "Your full residential address."],
        ["Identity documents", "An ID card, passport or residence permit, plus a recent proof of address."],
        ["Review and submit", "Check your details, then send your application."],
        ["Compliance review", "Our team verifies your identity, then opens your USD account. We'll notify you."],
      ]
    : [
        ["Informations personnelles", "Nom, date de naissance, nationalité, résidence et profession — environ 2 minutes."],
        ["Adresse de résidence", "Votre adresse complète."],
        ["Pièces d'identité", "Carte d'identité, passeport ou titre de séjour, et un justificatif de domicile récent."],
        ["Relecture et envoi", "Vérifiez vos informations, puis envoyez votre dossier."],
        ["Examen de conformité", "Notre équipe vérifie votre identité puis ouvre votre compte en USD. Vous serez notifié."],
      ];

  const next = context ? nextOnboardingRoute(context) : "/onboarding";

  return (
    <AuthShell
      title={en ? "Your email is confirmed" : "Votre adresse e-mail est confirmée"}
      description={en ? "Welcome to RFC FINANCE Bank. Here is what comes next." : "Bienvenue chez RFC FINANCE Bank. Voici les prochaines étapes."}
    >
      <div className="space-y-5">
        <div role="status" className="flex items-start gap-3 rounded-xl border border-success/40 bg-success-muted px-4 py-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <p className="text-body-sm text-foreground">
            {en ? "Step 1 done: your email address is verified." : "Étape 1 terminée : votre adresse e-mail est vérifiée."}
          </p>
        </div>

        <ol className="space-y-3">
          {steps.map(([title, text], i) => (
            <li key={title} className="flex gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-label text-foreground">{i + 2}. {title}</p>
                <p className="text-body-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        {isPending ? (
          <div className="flex justify-center"><Spinner className="size-5" /></div>
        ) : (
          <Button asChild className="w-full touch-target">
            <Link to={context ? next : "/login"}>
              {context ? (en ? "Start the next step" : "Commencer l'étape suivante") : en ? "Sign in to continue" : "Se connecter pour continuer"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost" className="w-full touch-target">
          <Link to="/onboarding">{en ? "See my full progress" : "Voir toute ma progression"}</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
