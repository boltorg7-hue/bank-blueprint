import { useLanguage } from "@/components/providers/LanguageProvider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Circle, Dot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { buildOnboardingTasks, nextOnboardingRoute } from "@/features/onboarding/lib/tasks";
import { LIFECYCLE_LABELS } from "@/types/customer-lifecycle";

export const Route = createFileRoute("/onboarding/")({
  component: OnboardingHome,
});

/** Lightweight onboarding home used when the customer returns later (§62). */
function OnboardingHome() {
  const { data: context, isPending, isError } = useCustomerContext();
  const { language } = useLanguage();
  const en = language === "en";

  if (isPending) {
    return (
      <OnboardingShell title={en ? "Open your account" : "Votre ouverture de compte"}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">{en ? "Loading your application…" : "Chargement de votre suivi…"}</span>
        </div>
      </OnboardingShell>
    );
  }

  if (isError || !context) {
    return (
      <OnboardingShell
        title={en ? "Open your account" : "Votre ouverture de compte"}
        description={
          en
            ? "We could not load your application. Please try again shortly."
            : "Nous n’avons pas pu charger votre suivi pour le moment. Réessayez dans un instant."
        }
      >
        <Button asChild variant="outline" className="touch-target">
          <Link to="/onboarding">{en ? "Try again" : "Réessayer"}</Link>
        </Button>
      </OnboardingShell>
    );
  }

  const tasks = buildOnboardingTasks(context);
  const resume = nextOnboardingRoute(context);

  return (
    <OnboardingShell
      title={en ? "Open your account" : "Votre ouverture de compte"}
      description={`${en ? "Current status" : "Statut actuel"} : ${en ? context.profile.lifecycle_state.replaceAll("_", " ").toLowerCase() : LIFECYCLE_LABELS[context.profile.lifecycle_state]}.`}
      why={
        en
          ? "We only ask for the information needed to open an account and verify your identity."
          : "Nous demandons uniquement les informations nécessaires à l’ouverture d’un compte et à la vérification de votre identité."
      }
    >
      <ul className="grid gap-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="group flex items-start gap-3 rounded-2xl border border-border/80 bg-card px-4 py-4 shadow-sm transition-all duration-200 hover:border-brand/30 hover:shadow-md sm:gap-4 sm:px-5"
          >
            <span
              className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-surface"
              aria-hidden="true"
            >
              {task.status === "done" ? (
                <Check className="size-4 text-success" />
              ) : task.status === "current" ? (
                <Dot className="size-4 text-brand" />
              ) : (
                <Circle className="size-4 text-muted-foreground" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-label font-semibold text-foreground">{en
                  ? (
                      {
                        email: "Email address confirmed",
                        profile: "Personal information",
                        address: "Residential address",
                        documents: "Identity verification",
                        review: "Submit your application",
                        activation: "Account opening",
                      } as Record<string, string>
                    )[task.id] ?? task.title
                  : task.title}</span>
              <span className="mt-1.5 block text-body-sm leading-relaxed text-muted-foreground">
                {en
                  ? (
                      {
                        email: context.emailVerified
                          ? "Your email address is confirmed."
                          : "Confirm your email address to secure your account.",
                        profile:
                          "Name, date of birth, nationality, country of residence and occupation.",
                        address: "Your full address in your country’s format.",
                        documents: "An identity document and proof of address.",
                        review:
                          "Review your details, then submit your application for verification.",
                        activation:
                          "After identity checks, account opening is reviewed separately.",
                      } as Record<string, string>
                    )[task.id] ?? task.description
                  : task.description}
              </span>
            </span>
            {task.status !== "done" ? (
              <Button asChild variant="ghost" size="sm" className="shrink-0 touch-target">
                <Link to={task.route}>{en ? "Open" : "Ouvrir"}</Link>
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="safe-pb sticky bottom-0 z-20 -mx-4 mt-7 rounded-t-2xl border-t border-border bg-background/95 px-4 py-4 shadow-[0_-8px_24px_-18px_hsl(var(--foreground)/0.25)] backdrop-blur sm:static sm:mx-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
        <p className="mb-2 text-caption font-medium text-muted-foreground" role="status">
          {tasks.filter((task) => task.status === "done").length}/{tasks.length}{" "}
          {en
            ? "steps completed — pick up where you left off."
            : "étapes terminées — reprenez là où vous vous êtes arrêté."
          }
        </p>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
            style={{
              width: `${(tasks.filter((task) => task.status === "done").length / tasks.length) * 100}%`,
            }}
          />
        </div>
        <Button asChild className="w-full touch-target shadow-sm">
          <Link to={resume}>{en ? "Resume my application" : "Reprendre mon ouverture"}</Link>
        </Button>
      </div>
    </OnboardingShell>
  );
}
