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
        description={en ? "We could not load your application. Please try again shortly." : "Nous n’avons pas pu charger votre suivi pour le moment. Réessayez dans un instant."}
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
      why={en ? "We only ask for the information needed to open an account and verify your identity." : "Nous demandons uniquement les informations nécessaires à l’ouverture d’un compte et à la vérification de votre identité."}
    >
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-4"
          >
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {task.status === "done" ? (
                <Check className="size-4 text-success" />
              ) : task.status === "current" ? (
                <Dot className="size-4 text-brand" />
              ) : (
                <Circle className="size-4 text-muted-foreground" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-label block text-foreground">{en ? ({email:"Email address confirmed",profile:"Personal information",address:"Residential address",documents:"Identity verification",review:"Submit your application",activation:"Account opening"} as Record<string,string>)[task.id] ?? task.title : task.title}</span>
              <span className="text-body-sm mt-1 block text-muted-foreground">
                {en ? ({email:context.emailVerified ? "Your email address is confirmed." : "Confirm your email address to secure your account.",profile:"Name, date of birth, nationality, country of residence and occupation.",address:"Your full address in your country’s format.",documents:"An identity document and proof of address.",review:"Review your details, then submit your application for verification.",activation:"After identity checks, account opening is reviewed separately."} as Record<string,string>)[task.id] ?? task.description : task.description}
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

      <Button asChild className="mt-6 w-full touch-target">
        <Link to={resume}>{en ? "Continue" : "Continuer"}</Link>
      </Button>
    </OnboardingShell>
  );
}
