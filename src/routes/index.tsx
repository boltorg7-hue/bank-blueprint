import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { CtaSection } from "@/features/public/components/CtaSection";
import { FaqSection } from "@/features/public/components/FaqSection";
import { faqJsonLd, publicMeta } from "@/features/public/lib/seo";
import { PUBLIC_CTA } from "@/features/public/content/site";
import {
  CORE_BENEFITS,
  HOME_FAQ,
  ONBOARDING_STEPS,
  SECURITY_HIGHLIGHTS,
} from "@/features/public/content/home";
import {
  HERITAGE_FACTS,
  HERO_PHOTO,
  LOCAL_NEWS,
  PLACE_PHOTOS,
  type HomePhoto,
} from "@/features/public/content/home-heritage";

const meta = publicMeta({
  title: "RFC Royal FINANCE Bank — Trinidad-et-Tobago depuis 1972",
  description:
    "Banque fondée en 1972 à Woodbrook, Trinidad-et-Tobago, supervisée par la Central Bank of Trinidad and Tobago. Comptes et virements en ligne.",
  path: "/",
});

const jsonLd = faqJsonLd(HOME_FAQ);

export const Route = createFileRoute("/")({
  head: () => ({ ...meta, ...jsonLd }),
  component: HomePage,
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function PhotoCredit({ photo }: { photo: HomePhoto }) {
  return (
    <a
      href={photo.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-caption text-muted-foreground underline-offset-2 hover:underline"
    >
      Photo : {photo.credit} · {photo.license}
    </a>
  );
}

function HomePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b border-border bg-surface-sunken px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-2 lg:items-center">
          <div className="min-w-0 space-y-5">
            <p className="text-overline text-brand">Trinidad-et-Tobago · depuis 1972</p>
            <h1 className="text-display text-balance text-foreground">
              Une banque de Woodbrook, au service de ses clients depuis plus de cinquante ans
            </h1>
            <p className="text-body-lg max-w-prose text-muted-foreground">
              Fondée le 23 juillet 1972, RFC Royal FINANCE Bank tient vos comptes en dollars
              américains et vous permet de suivre chaque virement depuis votre espace client.
            </p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Button asChild variant="brand" size="lg" className="touch-target">
                <Link to={PUBLIC_CTA.primaryTo} data-analytics-event="open_account_clicked">
                  Ouvrir un compte
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="touch-target">
                <Link to="/about">
                  Notre histoire
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
          <figure className="min-w-0">
            <img
              src={HERO_PHOTO.src}
              alt={HERO_PHOTO.alt}
              width={1920}
              height={1440}
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[var(--shadow-card)]"
              fetchPriority="high"
            />
            <figcaption className="mt-2 flex flex-wrap justify-between gap-2">
              <span className="text-caption text-foreground">{HERO_PHOTO.caption}</span>
              <PhotoCredit photo={HERO_PHOTO} />
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Heritage facts */}
      <PublicSection>
        <SectionHeader
          eyebrow="Notre identité"
          title="Une institution enregistrée et supervisée"
          description="Les informations officielles de la banque, telles qu'elles figurent dans nos documents légaux."
        />
        <dl className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HERITAGE_FACTS.map((fact) => (
            <div key={fact.label} className="rounded-2xl border border-border bg-surface p-5">
              <dt className="text-caption text-muted-foreground">{fact.label}</dt>
              <dd className="text-heading-sm mt-2 text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </PublicSection>

      {/* Local news */}
      <PublicSection tone="sunken">
        <SectionHeader
          eyebrow="Actualité du secteur"
          title="Ce qui se passe dans la finance à Trinidad-et-Tobago"
          description="Communiqués publics récents de la Central Bank of Trinidad and Tobago, notre autorité de supervision."
        />
        <ul className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          {LOCAL_NEWS.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand"
              >
                <time dateTime={item.date} className="text-caption text-muted-foreground">
                  {dateFormatter.format(new Date(item.date))} · Central Bank of Trinidad and Tobago
                </time>
                <h3 className="text-heading-sm mt-2 text-foreground">{item.title}</h3>
                <p className="text-body-sm mt-2 flex-1 text-muted-foreground">{item.summary}</p>
                <span className="text-label mt-4 inline-flex items-center gap-1 text-brand">
                  Lire le communiqué
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </PublicSection>

      {/* Places */}
      <PublicSection>
        <SectionHeader
          eyebrow="Chez nous"
          title="Ancrée à Trinidad-et-Tobago"
          description="De Port of Spain à la côte nord, les lieux qui entourent notre siège."
        />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
          {PLACE_PHOTOS.map((photo) => (
            <figure key={photo.src} className="min-w-0">
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="aspect-[3/2] w-full rounded-2xl object-cover"
              />
              <figcaption className="mt-2 flex flex-wrap justify-between gap-2">
                <span className="text-caption text-foreground">{photo.caption}</span>
                <PhotoCredit photo={photo} />
              </figcaption>
            </figure>
          ))}
        </div>
      </PublicSection>

      {/* Benefits */}
      <PublicSection tone="sunken">
        <SectionHeader eyebrow="Au quotidien" title="Votre compte, simplement" />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CORE_BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.title} className="rounded-2xl border border-border bg-surface p-5">
                <Icon className="size-6 text-brand" aria-hidden="true" />
                <h3 className="text-heading-sm mt-4 text-foreground">{benefit.title}</h3>
                <p className="text-body-sm mt-2 text-muted-foreground">{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </PublicSection>

      {/* Security */}
      <PublicSection>
        <SectionHeader
          eyebrow="Sécurité"
          title="Votre compte est protégé à chaque étape"
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
              <article key={item.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
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

      {/* Onboarding */}
      <PublicSection tone="sunken">
        <SectionHeader eyebrow="Ouverture de compte" title="Cinq étapes, entièrement en ligne" />
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

      {/* FAQ */}
      <PublicSection>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            eyebrow="Questions fréquentes"
            title="Les réponses les plus demandées"
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
