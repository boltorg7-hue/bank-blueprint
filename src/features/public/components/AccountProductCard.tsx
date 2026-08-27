import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PUBLIC_CTA } from "@/features/public/content/site";
import type { AccountProduct } from "@/features/public/content/accounts";
import { cn } from "@/lib/utils";

/** Account product presentation (§29). No invented rates or regulated details. */
export function AccountProductCard({
  product,
  className,
}: {
  product: AccountProduct;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <h3 className="text-heading-md text-foreground">{product.name}</h3>
      <p className="text-body-sm mt-2 text-muted-foreground">{product.summary}</p>

      <ul className="mt-5 space-y-2">
        {product.benefits.map((benefit) => (
          <li key={benefit} className="text-body-sm flex gap-2 text-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            <span className="min-w-0">{benefit}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-3 border-t border-border pt-4">
        <div>
          <dt className="text-overline text-muted-foreground">Tarifs</dt>
          <dd className="text-body-sm mt-1 text-foreground">{product.pricingSummary}</dd>
        </div>
        <div>
          <dt className="text-overline text-muted-foreground">Éligibilité</dt>
          <dd className="text-body-sm mt-1 text-foreground">{product.eligibility}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button asChild className="touch-target sm:flex-1">
          <Link to={PUBLIC_CTA.primaryTo} data-analytics-event="open_account_clicked">
            {product.ctaLabel}
          </Link>
        </Button>
        <Button asChild variant="outline" className="touch-target sm:flex-1">
          <Link to="/pricing">Voir les tarifs</Link>
        </Button>
      </div>
    </article>
  );
}
