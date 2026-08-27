import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { PUBLIC_CTA } from "@/features/public/content/site";
import { cn } from "@/lib/utils";

/** Conversion block used near the bottom of public pages (§52). */
export function CtaSection({
  title = "Prêt à ouvrir votre compte ?",
  description = "L'ouverture se fait en ligne. Vous suivez chaque étape depuis votre espace, jusqu'à l'activation du compte.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={cn("px-4 py-14 sm:px-6 sm:py-20", className)}>
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-heading-lg">{title}</h2>
          <p className="text-body opacity-90">{description}</p>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="brand" size="lg" className="touch-target">
            <Link to={PUBLIC_CTA.primaryTo} data-analytics-event="open_account_clicked">
              {PUBLIC_CTA.primary}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="touch-target border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link to={PUBLIC_CTA.secondaryTo} data-analytics-event="sign_in_clicked">
              {PUBLIC_CTA.secondary}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
