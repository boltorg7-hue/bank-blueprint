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

  if (isPending) {
    return (
      <OnboardingShell title="Votre ouverture de compte">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-body-sm">Chargement de votre suivi…</span>
        </div>
      </OnboardingShell>
    );
  }

  if (isError || !context) {
    return (
      <OnboardingShell
        title="Votre ouverture de compte"
        description="Nous n'avons pas pu charger votre suivi pour le moment. Réessayez dans un instant."
      >
        <Button asChild variant="outline" className="touch-target">
          <Link to="/onboarding">Réessayer</Link>
        </Button>
      </OnboardingShell>
    );
  }

  const tasks = buildOnboardingTasks(context);
  const resume = nextOnboardingRoute(context);

  return (
    <OnboardingShell
      title="Votre ouverture de compte"
      description={`Statut actuel : ${LIFECYCLE_LABELS[context.profile.lifecycle_state]}.`}
      why="Nous demandons uniquement les informations nécessaires à l'ouverture d'un compte et à la vérification de votre identité."
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
              <span className="text-label block text-foreground">{task.title}</span>
              <span className="text-body-sm mt-1 block text-muted-foreground">
                {task.description}
              </span>
            </span>
            {task.status !== "done" ? (
              <Button asChild variant="ghost" size="sm" className="shrink-0 touch-target">
                <Link to={task.route}>Ouvrir</Link>
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      <Button asChild className="mt-6 w-full touch-target">
        <Link to={resume}>Continuer</Link>
      </Button>
    </OnboardingShell>
  );
}
