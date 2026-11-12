import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      {
        name: "description",
        content:
          "Votre adresse e-mail est confirmée : découvrez les prochaines étapes de l'ouverture de votre compte.",
      },
      { property: "og:title", content: "Adresse e-mail confirmée — RFC FINANCE Bank" },
      {
        property: "og:description",
        content: "Les prochaines étapes de l'ouverture de votre compte RFC.",
      },
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
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
  }, []);
  const query = useCustomerContext({ enabled: hasSession === true });
  const context = query.data;
  const isPending = hasSession === null || (hasSession && query.isLoading);

  const steps = en
    ? [
        [
          "Personal details",
          "Name, date of birth, nationality, residence and occupation — about 2 minutes.",
        ],
        ["Home address", "Your full residential address."],
        [
          "Identity documents",
          "An ID card, passport or residence permit, plus a recent proof of address.",
        ],
        ["Review and submit", "Check your details, then send your application."],
        [
          "Compliance review",
          "Our team verifies your identity, then opens your USD account. We'll notify you.",
        ],
      ]
    : [
        [
          "Informations personnelles",
          "Nom, date de naissance, nationalité, résidence et profession — environ 2 minutes.",
        ],
        ["Adresse de résidence", "Votre adresse complète."],
        [
          "Pièces d'identité",
          "Carte d'identité, passeport ou titre de séjour, et un justificatif de domicile récent.",
        ],
        ["Relecture et envoi", "Vérifiez vos informations, puis envoyez votre dossier."],
        [
          "Examen de conformité",
          "Notre équipe vérifie votre identité puis ouvre votre compte en USD. Vous serez notifié.",
        ],
      ];

  const next = context ? nextOnboardingRoute(context) : "/onboarding";

  return (
    <AuthShell
      title={en ? "Your email is confirmed" : "Votre adresse e-mail est confirmée"}
      description={
        en
          ? "Welcome to RFC FINANCE Bank. Here is what comes next."
          : "Bienvenue chez RFC FINANCE Bank. Voici les prochaines étapes."
      }
    >
      <div className="space-y-5">
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-success/40 bg-success-muted px-4 py-3"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-body-sm text-foreground">
              {en
                ? "Step 1 done: your email address is verified."
                : "Étape 1 terminée : votre adresse e-mail est vérifiée."}
            </p>
            {context ? (
              <p className="mt-1 text-body-sm text-muted-foreground">
                {en
                  ? "Registration details received for"
                  : "Premières informations enregistrées pour"}{" "}
                <span className="font-medium text-foreground">
                  {[context.profile.first_name, context.profile.last_name]
                    .filter(Boolean)
                    .join(" ")}
                </span>
                {context.email ? ` · ${context.email}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        <ol className="space-y-3">
          {steps.map(([title, text], i) => (
            <li
              key={title}
              className="flex gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-label text-foreground">
                  {i + 2}. {title}
                </p>
                <p className="text-body-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        {isPending ? (
          <div className="flex justify-center">
            <Spinner className="size-5" />
          </div>
        ) : query.isError && hasSession ? (
          <div className="space-y-3">
            <p role="alert" className="text-body-sm text-destructive">
              {en
                ? "Your email is confirmed, but we could not load your registration details. Your account has not been reset. Please retry."
                : "Votre e-mail est confirmé, mais nous n’avons pas pu charger vos informations d’inscription. Votre dossier n’a pas été réinitialisé. Veuillez réessayer."}
            </p>
            <Button className="w-full touch-target" onClick={() => void query.refetch()}>
              {en ? "Retry loading my application" : "Réessayer de charger mon dossier"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ) : context ? (
          <Button asChild className="w-full touch-target">
            <Link to={next}>
              {en ? "Start the next step" : "Commencer l'étape suivante"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full touch-target">
            <Link to="/login">
              {en ? "Sign in to continue" : "Se connecter pour continuer"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
        {context ? (
          <Button asChild variant="ghost" className="w-full touch-target">
            <Link to="/onboarding">
              {en ? "See my full progress" : "Voir toute ma progression"}
            </Link>
          </Button>
        ) : null}
      </div>
    </AuthShell>
  );
}
