import {
  LEGAL_IDENTITY_PENDING_LABEL,
  LEGAL_IDENTITY_ROWS,
  LEGAL_IDENTITY_SUMMARY_ROWS,
  type LegalIdentityRow,
} from "@/features/public/content/site";
import { cn } from "@/lib/utils";

/**
 * Single presentation of the bank's coordinates, shared by the footer, the
 * contact page and the legal hub so labels, order and wording never diverge.
 */
export function LegalIdentityList({
  variant = "full",
  layout = "stack",
  className,
}: {
  variant?: "full" | "summary";
  layout?: "stack" | "grid";
  className?: string | undefined;
}) {
  const rows: LegalIdentityRow[] =
    variant === "summary" ? LEGAL_IDENTITY_SUMMARY_ROWS : LEGAL_IDENTITY_ROWS;

  return (
    <dl
      className={cn(
        layout === "grid"
          ? "grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3"
          : "space-y-4",
        className,
      )}
    >
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <dt className="text-overline text-muted-foreground">{row.label}</dt>
          <dd className="text-body-sm mt-1 break-words text-foreground">
            {row.value ?? (
              <span className="text-muted-foreground">{LEGAL_IDENTITY_PENDING_LABEL}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
