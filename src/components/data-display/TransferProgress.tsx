import { Check, Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type TransferStageState = "done" | "current" | "upcoming" | "failed";

export type TransferStage = {
  id: string;
  label: string;
  description?: string;
  state: TransferStageState;
  timestamp?: string;
};

/**
 * Vertical timeline for a transfer lifecycle (PROMPT 01 §20).
 * The caller supplies stage states from server data; nothing is inferred here.
 */
export function TransferProgress({
  stages,
  className,
}: {
  stages: TransferStage[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-0", className)} role="list">
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        const Icon = stage.state === "failed" ? X : stage.state === "done" ? Check : Clock;
        return (
          <li key={stage.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border",
                  stage.state === "done" && "border-transparent bg-success-muted text-success",
                  stage.state === "current" && "border-transparent bg-info-muted text-info",
                  stage.state === "failed" && "border-transparent bg-danger-muted text-danger",
                  stage.state === "upcoming" && "border-border bg-surface-sunken text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn("my-1 w-px flex-1", stage.state === "done" ? "bg-success" : "bg-border")}
                />
              )}
            </div>
            <div className={cn("min-w-0 pb-5", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-label",
                  stage.state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {stage.label}
              </p>
              {stage.description && (
                <p className="text-caption mt-0.5 text-muted-foreground">{stage.description}</p>
              )}
              {stage.timestamp && (
                <p className="text-numeric text-caption mt-0.5 text-muted-foreground">
                  {stage.timestamp}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
