import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Clock, Info, MinusCircle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Status vocabulary shared by every surface (PROMPT 01 §26).
 * Colour is never the only signal: an icon + text label always accompany it.
 */
const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-caption font-semibold [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        success: "border-transparent bg-success-muted text-success",
        pending: "border-transparent bg-warning-muted text-warning",
        failed: "border-transparent bg-danger-muted text-danger",
        info: "border-transparent bg-info-muted text-info",
        neutral: "border-border bg-surface-sunken text-muted-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type StatusTone = NonNullable<VariantProps<typeof statusBadgeVariants>["tone"]>;

const toneIcon: Record<StatusTone, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  pending: Clock,
  failed: XCircle,
  info: Info,
  neutral: MinusCircle,
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusBadgeVariants> {
  label: string;
  /** Override the default tone icon (e.g. a warning triangle on a review state). */
  icon?: React.ComponentType<{ className?: string }>;
  hideIcon?: boolean;
}

export function StatusBadge({
  label,
  tone = "neutral",
  icon,
  hideIcon = false,
  className,
  ...props
}: StatusBadgeProps) {
  const Icon = icon ?? toneIcon[tone ?? "neutral"] ?? AlertTriangle;
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)} {...props}>
      {!hideIcon && <Icon aria-hidden="true" />}
      {label}
    </span>
  );
}

export { statusBadgeVariants };
