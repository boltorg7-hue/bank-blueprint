import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { ONBOARDING_FLOW } from "@/features/onboarding/lib/tasks";

/**
 * Progressive onboarding frame (§27, §28).
 * Shows what is asked, why, and where the customer stands — real completed
 * steps only, no invented percentages.
 */
export function OnboardingShell({
  stepId,
  title,
  description,
  why,
  children,
}: {
  stepId?: string;
  title: string;
  description?: string;
  why?: string;
  children: ReactNode;
}) {
  const index = ONBOARDING_FLOW.findIndex((step) => step.id === stepId);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      {index >= 0 ? (
        <div className="mb-6">
          <p className="text-caption text-muted-foreground">
            Étape {index + 1} sur {ONBOARDING_FLOW.length}
          </p>
          <ol className="mt-3 flex flex-wrap gap-2" aria-label="Progression de l'ouverture de compte">
            {ONBOARDING_FLOW.map((step, position) => {
              const state =
                position < index ? "done" : position === index ? "current" : "upcoming";
              return (
                <li key={step.id}>
                  <span
                    aria-current={state === "current" ? "step" : undefined}
                    className={
                      state === "current"
                        ? "text-caption rounded-full bg-brand px-3 py-1 text-brand-foreground"
                        : state === "done"
                          ? "text-caption rounded-full border border-success/40 bg-success-muted px-3 py-1 text-foreground"
                          : "text-caption rounded-full border border-border px-3 py-1 text-muted-foreground"
                    }
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      <h1 className="text-heading-lg text-foreground">{title}</h1>
      {description ? (
        <p className="text-body mt-3 text-muted-foreground">{description}</p>
      ) : null}
      {why ? (
        <p className="text-body-sm mt-4 rounded-xl border border-border bg-surface px-4 py-3 text-muted-foreground">
          {why}
        </p>
      ) : null}

      <div className="mt-8">{children}</div>

      <p className="text-caption mt-10 text-muted-foreground">
        Vous pouvez interrompre à tout moment : votre progression est conservée.{" "}
        <Link to="/onboarding" className="text-brand underline-offset-4 hover:underline">
          Revenir à mon suivi
        </Link>
      </p>
    </div>
  );
}
