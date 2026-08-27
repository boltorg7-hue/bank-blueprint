import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type StepperStep = {
  id: string;
  label: string;
};

/**
 * Multi-step progress indicator for guided flows (transfer, onboarding).
 * Presentation only — step state is owned by the flow that renders it.
 */
export function Stepper({
  steps,
  currentIndex,
  className,
}: {
  steps: StepperStep[];
  currentIndex: number;
  className?: string;
}) {
  const current = steps[Math.min(Math.max(currentIndex, 0), steps.length - 1)];

  return (
    <div className={cn("w-full", className)}>
      <ol className="flex items-center gap-2" role="list">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "text-caption flex size-7 shrink-0 items-center justify-center rounded-full border font-semibold",
                  done && "border-transparent bg-success text-success-foreground",
                  active && "border-primary bg-primary text-primary-foreground",
                  !done && !active && "border-border bg-surface-sunken text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-caption hidden truncate sm:block",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn("h-px flex-1", done ? "bg-success" : "bg-border")}
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-caption mt-2 text-muted-foreground sm:hidden" aria-live="polite">
        Étape {Math.min(currentIndex + 1, steps.length)} sur {steps.length}
        {current ? ` — ${current.label}` : ""}
      </p>
    </div>
  );
}
