import {
  PRICE_UNDEFINED_LABEL,
  type PricingCategory,
} from "@/features/public/content/pricing";
import { cn } from "@/lib/utils";

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
              {category.title}
            </h3>
            <p className="text-body-sm mt-1 text-muted-foreground">{category.description}</p>
          </header>
          <dl className="divide-y divide-border">
            {category.lines.map((line) => (
              <div
                key={line.label}
                className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <div className="min-w-0">
                  <dt className="text-body-sm text-foreground">{line.label}</dt>
                  {line.note && (
                    <p className="text-caption mt-1 text-muted-foreground">{line.note}</p>
                  )}
                </div>
                <dd
                  className={cn(
                    "text-numeric shrink-0 text-sm font-semibold",
                    line.amount ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {line.amount ?? PRICE_UNDEFINED_LABEL}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
