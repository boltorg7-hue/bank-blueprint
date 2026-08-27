import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StateTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneStyles: Record<StateTone, { wrap: string; icon: string }> = {
  neutral: { wrap: "border-border bg-surface", icon: "bg-muted text-muted-foreground" },
  info: { wrap: "border-border bg-info-muted/40", icon: "bg-info text-info-foreground" },
  success: {
    wrap: "border-border bg-success-muted/40",
    icon: "bg-success text-success-foreground",
  },
  warning: {
    wrap: "border-border bg-warning-muted/40",
    icon: "bg-warning text-warning-foreground",
  },
  danger: { wrap: "border-border bg-danger-muted/40", icon: "bg-danger text-danger-foreground" },
};

/**
 * Shared presentation shell for every application state (empty, error,
 * permission denied, network unavailable...).
 *
 * Status is never communicated by color alone: an icon and explicit text are
 * always rendered together (WCAG 2.2 AA, docs/banking/00 §21).
 */
export function StateBlock({
  icon: Icon,
  title,
  description,
  tone = "neutral",
  actions,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string | undefined;
  tone?: StateTone | undefined;
  actions?: ReactNode | undefined;
  className?: string | undefined;
}) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-xl border px-5 py-8 text-center sm:px-8",
        styles.wrap,
        className,
      )}
    >
      <span
        className={cn("flex size-11 items-center justify-center rounded-full", styles.icon)}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto max-w-prose text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
