import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { CtaSection } from "@/features/public/components/CtaSection";
import { FaqSection } from "@/features/public/components/FaqSection";
import {
  AccountPreview,
  DocumentPreview,
  StatementPreview,
  TransferPreview,
} from "@/features/public/components/ProductPreview";
import { faqJsonLd, publicMeta } from "@/features/public/lib/seo";
import { PUBLIC_CTA } from "@/features/public/content/site";
import {
  CORE_BENEFITS,
  FINANCIAL_CONTROL,
  HERO,
  HOME_FAQ,
  INNOVATION_ITEMS,
  ONBOARDING_STEPS,
  PRODUCT_STORY,
  SECURITY_HIGHLIGHTS,
  SUPPORT_SECTION,
  TRUST_STRIP,
} from "@/features/public/content/home";

const meta = publicMeta({
  title: "Banque en ligne claire et sécurisée",
  description:
    "Consultez votre solde en temps réel, effectuez vos virements et suivez chaque étape depuis votre espace client. Ouverture de compte en ligne.",
  path: "/",
});

const jsonLd = faqJsonLd(HOME_FAQ);

export const Route = createFileRoute("/")({
  head: () => ({ ...meta, ...jsonLd }),
  component: HomePage,
});

const STORY_PREVIEWS: Record<string, () => React.ReactElement> = {
  overview: () => <AccountPreview />,
  transfers: () => <TransferPreview />,
  verification: () => <DocumentPreview />,
  documents: () => <StatementPreview />,
};

function HomePage() {
  return (
    <PublicLayout>
      {/* Hero — §11 to §13 */}
      <section className="border-b border-border bg-surface-sunken px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="min-w-0 space-y-5">
            <p className="text-overline text-brand">{HERO.eyebrow}</p>
            <h1 className="text-display text-balance text-foreground">{HERO.headline}</h1>
            <p className="text-body-lg max-w-prose text-muted-foreground">{HERO.subline}</p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Button asChild variant="brand" size="lg" className="touch-target">
                <Link to={PUBLIC_CTA.primaryTo} data-analytics-event="open_account_clicked">
                  {HERO.primaryCta}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="touch-target">
                <Link to="/features">
                  {HERO.secondaryCta}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <ul className="grid grid-cols-2 gap-3 pt-4 sm:flex sm:flex-wrap sm:gap-5">
              {TRUST_STRIP.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label} className="text-body-sm flex items-center gap-2 text-muted-foreground">
                    <Icon className="size-4 shrink-0 text-brand" aria-hidden="true" />
                    <span className="min-w-0 truncate">{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <AccountPreview compact className="lg:mt-0" />
        </div>
      </section>

      {/* Core benefits — §15 */}
      <PublicSection>
        <SectionHeader
          eyebrow="Ce que vous obtenez"
          title="Une banque qui montre clairement ce qui se passe"
          description="Quatre bénéfices concrets, sans jargon et sans promesse que le produit ne tient pas."
        />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CORE_BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article
                key={benefit.title}
                className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <Icon className="size-6 text-brand" aria-hidden="true" />
                <h3 className="text-heading-sm mt-4 text-foreground">{benefit.title}</h3>
                <p className="text-body-sm mt-2 text-muted-foreground">{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </PublicSection>

      {/* Product story — §16 to §22, §83 */}
      <PublicSection tone="sunken">
        <SectionHeader
          eyebrow="Le produit"
          title="Voir, déplacer, vérifier, documenter"
          description="Le parcours réel d'un client, écran par écran."
        />
        <div className="mt-10 space-y-14">
          {PRODUCT_STORY.map((story, index) => {
            const Icon = story.icon;
            const Preview = STORY_PREVIEWS[story.id];
            return (
              <div
                key={story.id}
                className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 lg:grid-cols-2"
              >
                <div className={index % 2 === 1 ? "min-w-0 lg:order-2" : "min-w-0"}>
                  <p className="text-overline text-brand">{story.eyebrow}</p>
                  <h3 className="text-heading-md mt-2 flex items-start gap-3 text-foreground">
                    <Icon className="mt-1 size-5 shrink-0 text-brand" aria-hidden="true" />
                    <span className="min-w-0">{story.title}</span>
                  </h3>
                  <p className="text-body mt-3 max-w-prose text-muted-foreground">{story.description}</p>
                  <ul className="mt-4 space-y-2">
                    {story.points.map((point) => (
                      <li key={point} className="text-body-sm flex gap-2 text-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                        <span className="min-w-0">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={index % 2 === 1 ? "min-w-0 lg:order-1" : "min-w-0"}>
                  {Preview ? <Preview /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </PublicSection>

      {/* Financial control — §19, §20 */}
      <PublicSection>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2 lg:items-center">
          <div className="min-w-0">
            <SectionHeader eyebrow="Maîtrise" title={FINANCIAL_CONTROL.title} description={FINANCIAL_CONTROL.description} />
            <ul className="mt-5 space-y-2">
              {FINANCIAL_CONTROL.points.map((point) => (
                <li key={point} className="text-body-sm flex gap-2 text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span className="min-w-0">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <AccountPreview />
        </div>
      </PublicSection>

      {/* Security — §23 */}
      <PublicSection tone="sunken">
        <SectionHeader
          eyebrow="Sécurité"
          title="Votre compte est protégé à chaque étape"
          description="La sécurité est expliquée en langage clair, sans détail technique exploitable."
          actions={
            <Button asChild variant="outline" className="touch-target">
              <Link to="/security">Voir la page sécurité</Link>
            </Button>
          }
        />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          {SECURITY_HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="flex gap-4 rounded-2xl border border-border bg-surface p-5"
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="text-heading-sm text-foreground">{item.title}</h3>
                  <p className="text-body-sm mt-1 text-muted-foreground">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </PublicSection>

      {/* Support — §25 */}
      <PublicSection>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2 lg:items-center">
          <div className="min-w-0">
            <SectionHeader eyebrow="Assistance" title={SUPPORT_SECTION.title} description={SUPPORT_SECTION.description} />
            <ul className="mt-5 space-y-2">
              {SUPPORT_SECTION.points.map((point) => (
                <li key={point} className="text-body-sm flex gap-2 text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span className="min-w-0">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
            {INNOVATION_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-xl border border-border bg-surface p-4">
                  <Icon className="size-5 text-brand" aria-hidden="true" />
                  <h3 className="text-label mt-3 text-foreground">{item.title}</h3>
                  <p className="text-caption mt-1 text-muted-foreground">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </PublicSection>

      {/* Onboarding steps — §27 */}
      <PublicSection tone="sunken">
        <SectionHeader
          eyebrow="Ouverture de compte"
          title="Cinq étapes, entièrement en ligne"
          description="Aucun délai de validation n'est promis : le compte est activé après validation du dossier."
        />
        <ol className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ONBOARDING_STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-border bg-surface p-5">
              <span className="text-numeric text-caption inline-flex size-7 items-center justify-center rounded-full bg-brand text-brand-foreground">
                {index + 1}
              </span>
              <h3 className="text-label mt-3 text-foreground">{step.title}</h3>
              <p className="text-caption mt-1 text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </PublicSection>

      {/* FAQ — §44 */}
      <PublicSection>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            eyebrow="Questions fréquentes"
            title="Les réponses les plus demandées"
            description="Le centre d'aide contient l'ensemble des articles."
            actions={
              <Button asChild variant="outline" className="touch-target">
                <Link to="/help">Centre d'aide</Link>
              </Button>
            }
          />
          <FaqSection items={HOME_FAQ} idPrefix="home-faq" />
        </div>
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
