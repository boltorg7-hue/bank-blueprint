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
      {/* Photograph first, then the bank's own story — no staged people or invented history. */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
          <figure className="relative">
            <img
              src={HERO_PHOTO.src}
              alt={HERO_PHOTO.alt}
              width={1920}
              height={1440}
              className="h-[29vh] min-h-44 max-h-72 w-full object-cover object-center sm:h-[42vh] sm:max-h-[440px]"
              fetchPriority="high"
            />
            <figcaption className="mt-2 flex flex-wrap justify-between gap-x-5 gap-y-1">
              <span className="text-caption text-foreground">{HERO_PHOTO.caption}</span>
              <PhotoCredit photo={HERO_PHOTO} />
            </figcaption>
          </figure>
          <div className="grid gap-5 py-7 sm:py-9 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
            <div className="min-w-0 animate-enter">
              <p className="text-overline mb-3 text-brand">Trinidad-et-Tobago · depuis 1972</p>
              <h1 className="text-display max-w-3xl text-balance text-foreground sm:text-5xl lg:text-6xl">RFC Royal FINANCE Bank</h1>
              <p className="text-heading-md mt-3 max-w-2xl text-foreground">Une banque ancrée à Woodbrook, pensée pour vos projets d’aujourd’hui.</p>
            </div>
            <div className="min-w-0">
              <p className="text-body max-w-prose text-muted-foreground">Fondée le 23 juillet 1972 à Trinidad-et-Tobago. Consultez votre compte en dollars américains et suivez vos virements depuis votre espace client.</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button asChild variant="brand" size="lg" className="touch-target press-feedback active:press-feedback-active">
                  <Link to={PUBLIC_CTA.primaryTo} data-analytics-event="open_account_clicked">Ouvrir un compte <ArrowRight className="size-4" aria-hidden="true" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="touch-target">
                  <Link to="/about">Notre histoire</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Heritage facts */}
      <PublicSection tone="sunken" className="border-y border-border py-10 sm:py-14">
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-overline text-brand">Notre histoire en bref</p>
            <h2 className="text-heading-xl mt-3 max-w-md text-foreground">Depuis 1972, ici à Trinidad-et-Tobago.</h2>
            <p className="text-body mt-3 max-w-prose text-muted-foreground">Notre identité et nos coordonnées officielles, sans promesses inventées.</p>
            <Button asChild variant="link" className="mt-3 px-0 text-brand"><Link to="/about">Découvrir la banque <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
          </div>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-5 border-t border-border pt-4 sm:gap-x-8 lg:border-t-0 lg:pt-0">
          {HERITAGE_FACTS.map((fact) => (
            <div key={fact.label} className="min-w-0 border-b border-border pb-4">
              <dt className="text-overline text-brand">{fact.label}</dt>
              <dd className="text-heading-sm mt-2 break-words text-foreground">{fact.value}</dd>
            </div>
          ))}
          </dl>
        </div>
      </PublicSection>

      {/* Local news */}
      <PublicSection className="bg-primary py-12 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-overline text-warning-muted">Regards sur la région</p>
            <h2 className="text-heading-xl mt-3 text-primary-foreground">L’actualité financière à Trinidad-et-Tobago</h2>
            <p className="text-body mt-4 max-w-prose text-primary-foreground/75">Communiqués datés de la Central Bank of Trinidad and Tobago, à consulter directement à la source.</p>
          </div>
          <ul className="divide-y divide-primary-foreground/20 border-t border-primary-foreground/20">
          {LOCAL_NEWS.map((item, index) => (
            <li key={item.url} className="min-w-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid min-h-32 grid-cols-[minmax(0,1fr)_auto] gap-4 py-5 transition-colors hover:bg-primary-foreground/5"
              >
                <div className="min-w-0">
                  <time dateTime={item.date} className="text-caption text-primary-foreground/65">{dateFormatter.format(new Date(item.date))} · Banque centrale</time>
                  <h3 className="text-heading-sm mt-2 text-primary-foreground">{item.title}</h3>
                  {index === 0 && <p className="text-body-sm mt-2 text-primary-foreground/75">{item.summary}</p>}
                </div>
                <ArrowUpRight className="size-5 shrink-0 text-warning-muted transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" />
              </a>
            </li>
          ))}
          </ul>
        </div>
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
               className="aspect-[3/2] w-full object-cover transition-transform duration-500 motion-safe:hover:scale-[1.01]"
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
              <article key={benefit.title} className="border-t-2 border-brand bg-surface p-5 transition-transform motion-safe:hover:-translate-y-1">
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
              <article key={item.title} className="flex gap-4 border-b border-border py-5">
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
            <li key={step.title} className="border-t border-border p-5">
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
