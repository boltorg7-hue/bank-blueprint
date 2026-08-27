import { Link } from "@tanstack/react-router";

import { APP_CONFIG } from "@/config/app";
import { cn } from "@/lib/utils";

/** Bank wordmark. Placeholder identity — refined in PROMPT 01. */
export function BrandMark({
  to = "/",
  className,
  compact = false,
}: {
  to?: "/" | "/app/dashboard" | "/admin/dashboard";
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 rounded-md text-foreground transition-colors hover:text-brand",
        className,
      )}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
        aria-hidden="true"
      >
        V
      </span>
      {!compact ? (
        <span className="text-base font-semibold tracking-tight">{APP_CONFIG.name}</span>
      ) : null}
    </Link>
  );
}
