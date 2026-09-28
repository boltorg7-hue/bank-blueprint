import {
  LEGAL_IDENTITY_PENDING_LABEL,
  LEGAL_IDENTITY_ROWS,
  LEGAL_IDENTITY_SUMMARY_ROWS,
  type LegalIdentityRow,
} from "@/features/public/content/site";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();
  const labels: Record<string, string> = { "Entité juridique": "Legal entity", Immatriculation: "Registration", "Siège social": "Registered office", "Adresse postale": "Mailing address", "Code SWIFT/BIC": "SWIFT/BIC", "Date de création": "Founded", "Autorité de supervision": "Supervisor", "Capital social": "Share capital", "Référence d'agrément": "Licence reference", "Protection des dépôts": "Deposit protection" };
  const rows: LegalIdentityRow[] =
    variant === "summary" ? LEGAL_IDENTITY_SUMMARY_ROWS : LEGAL_IDENTITY_ROWS;

  return (
    <dl
      className={cn(
        layout === "grid"
          ? "grid grid-cols-[minmax(0,1fr)] gap-y-0 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          : "space-y-4",
        className,
      )}
    >
      {rows.map((row) => (
        <div
          key={row.label}
          className={cn(
            "min-w-0",
            layout === "grid" &&
              "border-b border-border/60 py-3.5 first:border-t-0 last:border-b-0 sm:border-0 sm:py-0",
          )}
        >
          <dt className="text-overline text-muted-foreground">{language === "en" ? labels[row.label] ?? row.label : row.label}</dt>
          <dd className="text-body-sm mt-1 break-words leading-relaxed text-foreground">
            {row.value ?? (
              <span className="inline-flex items-center rounded-md border border-dashed border-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                {language === "en" ? "Not disclosed" : LEGAL_IDENTITY_PENDING_LABEL}
              </span>
            )}
          </dd>

        </div>
      ))}
    </dl>
  );
}
