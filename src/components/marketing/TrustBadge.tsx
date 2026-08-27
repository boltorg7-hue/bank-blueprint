import type { ComponentType } from "react";
import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/** Small inline trust signal used in headers, heroes and footers. */
export function TrustBadge({
  label,
  icon: Icon = BadgeCheck,
  className,
}: {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-caption inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 font-medium text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5 text-brand" aria-hidden="true" />
      {label}
    </span>
  );
}
