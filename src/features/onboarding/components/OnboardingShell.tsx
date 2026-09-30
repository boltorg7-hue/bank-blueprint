import { useLanguage } from "@/components/providers/LanguageProvider";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { OnboardingAssistant } from "@/features/onboarding/components/OnboardingAssistant";
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
  const { language } = useLanguage();
  const en = language === "en";
  const index = ONBOARDING_FLOW.findIndex((step) => step.id === stepId);
  const progress = index >= 0 ? Math.round(((index + 1) / ONBOARDING_FLOW.length) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      {index >= 0 ? (
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-caption text-muted-foreground">
              {en ? "Step" : "Étape"} {index + 1} {en ? "of" : "sur"} {ONBOARDING_FLOW.length}
            </p>
            <p className="text-caption text-muted-foreground">
              {progress} %
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <ol className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label={en ? "Account opening progress" : "Progression de l’ouverture de compte"}>
            {ONBOARDING_FLOW.map((step, position) => {
              const state =
                position < index ? "done" : position === index ? "current" : "upcoming";
              const label = en ? ({ profile: "Details", address: "Address", documents: "Identity", review: "Review" } as Record<string,string>)[step.id] ?? step.label : step.label;
              const base = "text-caption inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4";
              return (
                <li key={step.id} className="shrink-0">
                  {state === "done" ? (
                    <Link to={step.route} className={`${base} border border-success/40 bg-success-muted text-foreground`}>
                      ✓ {label}
                    </Link>
                  ) : (
                    <span
                      aria-current={state === "current" ? "step" : undefined}
                      className={
                        state === "current"
                          ? `${base} bg-brand text-brand-foreground`
                          : `${base} border border-border text-muted-foreground`
                      }
                    >
                      {label}
                    </span>
                  )}
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
      <OnboardingAssistant />

      <p className="text-caption mt-10 text-muted-foreground">
        {en ? "You can stop at any time: your progress is saved." : "Vous pouvez interrompre à tout moment : votre progression est conservée."}{" "}
        <Link to="/onboarding" className="text-brand underline-offset-4 hover:underline">
          {en ? "Back to my application" : "Revenir à mon suivi"}
        </Link>
      </p>
    </div>
  );
}
