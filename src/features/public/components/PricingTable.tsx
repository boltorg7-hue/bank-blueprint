import {
  PRICE_UNDEFINED_LABEL,
  type PricingCategory,
} from "@/features/public/content/pricing";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Pricing grid (§31). Rendered as stacked cards on mobile and as readable
 * rows on larger screens — never a cramped horizontal table.
 */
export function PricingTable({
  categories,
  className,
}: {
  categories: PricingCategory[];
  className?: string;
}) {
  const { language } = useLanguage();
  const en = language === "en";
  const translate: Record<string, string> = {
    "Tenue de compte": "Account maintenance", "Frais liés à l'ouverture et à la gestion du compte courant.": "Charges for opening and maintaining a current account.",
    "Virements": "Transfers", "Opérations de virement depuis votre compte. Le montant applicable vous est affiché avant confirmation, dans la devise du compte débité.": "Transfers from your account. Applicable charges are shown before confirmation in the account currency.",
    "Relevés et documents": "Statements and documents", "Documents générés depuis votre espace client.": "Documents generated in your customer account.",
    "Assistance": "Support", "Canaux d'assistance mis à disposition.": "Available support channels.",
    "Services additionnels": "Additional services", "Services optionnels, ajoutés au fur et à mesure de l'ouverture du produit.": "Optional services added as they become available.",
    "Messagerie sécurisée": "Secure messaging", "Assistance sur demande particulière": "Special requests", "Services optionnels": "Optional services",
    "Ouverture de compte": "Account opening", "Tenue de compte mensuelle": "Monthly account maintenance", "Clôture de compte": "Account closure",
    "Virement interne entre comptes RFC": "Internal transfer between RFC accounts", "Virement vers une autre banque": "Transfer to another bank",
    "Virement nécessitant une vérification complémentaire": "Transfer requiring additional review", "Relevé numérique (PDF)": "Digital statement (PDF)", "Duplicata de relevé": "Duplicate statement",
    "Prélevée le premier jour ouvré du mois.": "Charged on the first business day of the month.", "Exécution immédiate entre comptes tenus par la banque.": "Immediate execution between accounts held with the bank.",
    "Frais de règlement interbancaire, par virement sortant.": "Interbank settlement fee per outgoing transfer.", "Les contrôles de conformité ne sont jamais facturés.": "Compliance reviews are never charged.",
    "Sans frais": "No fee", "À définir": "To be confirmed",
  };
  const text = (value: string) => en ? translate[value] ?? value : value;
  return (
    <div className={cn("space-y-6", className)}>
      {categories.map((category) => (
        <section
          key={category.id}
          aria-labelledby={`pricing-${category.id}`}
          className="overflow-hidden rounded-2xl border border-border bg-surface"
        >
          <header className="border-b border-border bg-surface-sunken px-5 py-4">
            <h3 id={`pricing-${category.id}`} className="text-heading-sm text-foreground">
              {text(category.title)}
            </h3>
            <p className="text-body-sm mt-1 text-muted-foreground">{text(category.description)}</p>
          </header>
          <dl className="divide-y divide-border">
            {category.lines.map((line) => (
              <div
                key={line.label}
                className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <div className="min-w-0">
                  <dt className="text-body-sm text-foreground">{text(line.label)}</dt>
                  {line.note && (
                    <p className="text-caption mt-1 text-muted-foreground">{text(line.note)}</p>
                  )}
                </div>
                <dd
                  className={cn(
                    "text-numeric shrink-0 text-sm font-semibold",
                    line.amount ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {text(line.amount ?? PRICE_UNDEFINED_LABEL)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
