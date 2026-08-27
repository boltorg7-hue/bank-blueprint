import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { publicMeta } from "@/features/public/lib/seo";
import { ONBOARDING_STEPS } from "@/features/public/content/home";

const meta = publicMeta({
  title: "Ouvrir un compte",
  description:
    "Créez votre profil, confirmez vos coordonnées, renseignez les informations requises et vérifiez votre identité en ligne.",
  path: "/register",
});

export const Route = createFileRoute("/register")({
  head: () => meta,
  component: RegisterPage,
});

/**
 * Placeholder shell for account opening.
 * The full onboarding journey is delivered with the registration phase; the
 * steps below describe the real process, without promising approval delays.
 */
function RegisterPage() {
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-heading-lg text-foreground">Ouvrir un compte</h1>
        <p className="text-body mt-3 text-muted-foreground">
          Le parcours d'ouverture en ligne sera activé avec la mise en service de l'inscription.
          Voici les étapes prévues.
        </p>
        <ol className="mt-8 space-y-3">
          {ONBOARDING_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-3 rounded-xl border border-border bg-surface px-4 py-4"
            >
              <span className="text-numeric text-caption inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="text-label block text-foreground">{step.title}</span>
                <span className="text-body-sm mt-1 block text-muted-foreground">
                  {step.description}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="touch-target">
            <Link to="/accounts">Voir le compte courant</Link>
          </Button>
          <Button asChild variant="ghost" className="touch-target">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
