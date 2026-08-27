import { Link } from "@tanstack/react-router";

import { APP_CONFIG } from "@/config/app";
import { BRAND } from "@/config/brand";
import { cn } from "@/lib/utils";

/** Bank wordmark. Single source of truth for the brand name/symbol. */
export function BrandMark({
  to = "/",
  className,
  compact = false,
}: {
  to?: "/" | "/app/dashboard" | "/admin/dashboard";
  className?: string | undefined;
  compact?: boolean | undefined;
}) {
  return (
    <Link
      to={to}
      aria-label={APP_CONFIG.fullName}
      title={APP_CONFIG.fullName}
      className={cn(
        "flex items-center gap-2 rounded-md text-foreground transition-colors hover:text-brand",
        className,
      )}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
        aria-hidden="true"
      >
        {BRAND.symbol}
      </span>
      {!compact ? (
        <span className="text-base font-semibold tracking-tight">{APP_CONFIG.name}</span>
      ) : null}
    </Link>
  );
}

