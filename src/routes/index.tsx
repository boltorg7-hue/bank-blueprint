import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { CtaSection } from "@/features/public/components/CtaSection";
import { FaqSection } from "@/features/public/components/FaqSection";
import { faqJsonLd, publicMeta } from "@/features/public/lib/seo";
import { PUBLIC_CTA } from "@/features/public/content/site";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { HOME_EN } from "@/features/public/content/home-en";
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
  const { language } = useLanguage();
  const en = language === "en";
  const copy = (fr: string, english: string) => en ? english : fr;
  const dateFormatter = new Intl.DateTimeFormat(en ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return (
    <PublicLayout>
      {/* Photograph first, then the bank's own story — no staged people or invented history. */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl sm:px-6 sm:pt-8">
          <figure className="relative sm:overflow-hidden sm:rounded-md">
            <img
              src={HERO_PHOTO.src}
              alt={HERO_PHOTO.alt}
              width={1920}
              height={1440}
              className="h-[48svh] min-h-[320px] max-h-[520px] w-full object-cover object-center sm:h-[48vh]"
              fetchPriority="high"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 text-primary-foreground sm:px-8 sm:pb-8">
              <p className="text-overline text-warning-muted">{copy("Trinidad-et-Tobago · depuis 1972", HOME_EN.date)}</p>
              <h1 className="text-display mt-3 max-w-3xl text-balance text-primary-foreground sm:text-5xl lg:text-6xl">RFC Royal FINANCE Bank</h1>
              <p className="text-heading-sm mt-3 max-w-xl text-primary-foreground sm:text-heading-md">{copy("Une banque ancrée à Woodbrook, pensée pour vos projets d’aujourd’hui.", HOME_EN.intro)}</p>
            </div>
            <figcaption className="flex flex-wrap justify-between gap-x-5 gap-y-1 px-4 py-2 sm:px-0">
               <span className="text-caption text-foreground">{copy(HERO_PHOTO.caption, "Woodbrook, Port of Spain — the neighbourhood around our head office")}</span>
              <PhotoCredit photo={HERO_PHOTO} />
            </figcaption>
          </figure>
          <div className="grid gap-5 px-4 py-7 sm:px-0 sm:py-9 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
            <div className="min-w-0 animate-enter">
               <p className="text-body max-w-prose text-muted-foreground">{copy("Fondée le 23 juillet 1972 à Trinidad-et-Tobago. Consultez votre compte en dollars américains et suivez vos virements depuis votre espace client.", HOME_EN.lead)}</p>
              <div className="mt-5 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
                <Button asChild variant="brand" size="lg" className="touch-target press-feedback w-full active:press-feedback-active sm:w-auto">
                   <Link to={PUBLIC_CTA.primaryTo} data-analytics-event="open_account_clicked">{copy("Ouvrir un compte", HOME_EN.open)} <ArrowRight className="size-4" aria-hidden="true" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="touch-target w-full sm:w-auto">
                   <Link to="/about">{copy("Notre histoire", HOME_EN.history)}</Link>
                </Button>
              </div>
            </div>
            <div className="hidden border-l border-border pl-8 lg:block"><p className="text-overline text-brand">{copy("Une institution locale", "A local institution")}</p><p className="text-body mt-3 text-muted-foreground">{copy("Siège à Woodbrook, supervision de la Central Bank of Trinidad and Tobago.", "Headquartered in Woodbrook and supervised by the Central Bank of Trinidad and Tobago.")}</p></div>
          </div>
        </div>
      </section>

      {/* Heritage facts */}
      <PublicSection tone="sunken" className="border-y border-border py-10 sm:py-14">
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
             <p className="text-overline text-brand">{copy("Notre histoire en bref", HOME_EN.historyEyebrow)}</p>
             <h2 className="text-heading-xl mt-3 max-w-md text-foreground">{copy("Depuis 1972, ici à Trinidad-et-Tobago.", HOME_EN.historyTitle)}</h2>
             <p className="text-body mt-3 max-w-prose text-muted-foreground">{copy("Notre identité et nos coordonnées officielles, sans promesses inventées.", HOME_EN.historyDescription)}</p>
             <Button asChild variant="link" className="mt-3 px-0 text-brand"><Link to="/about">{copy("Découvrir la banque", HOME_EN.historyLink)} <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
          </div>
          <dl className="grid grid-cols-1 gap-x-5 gap-y-5 border-t border-border pt-4 min-[420px]:grid-cols-2 sm:gap-x-8 lg:border-t-0 lg:pt-0">
           {HERITAGE_FACTS.map((fact, index) => (
            <div key={fact.label} className="min-w-0 border-b border-border pb-4">
               <dt className="text-overline text-brand">{en ? HOME_EN.facts[index] : fact.label}</dt>
               <dd className="text-heading-sm mt-2 break-words text-foreground">{en && index === 0 ? "July 23, 1972" : en && index === 1 ? "Woodbrook, Trinidad and Tobago" : fact.value}</dd>
            </div>
          ))}
          </dl>
        </div>
      </PublicSection>

      {/* Local news */}
      <PublicSection className="bg-primary py-12 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
             <p className="text-overline text-warning-muted">{copy("Regards sur la région", HOME_EN.regional)}</p>
             <h2 className="text-heading-xl mt-3 text-primary-foreground">{copy("L’actualité financière à Trinidad-et-Tobago", HOME_EN.newsTitle)}</h2>
             <p className="text-body mt-4 max-w-prose text-primary-foreground/75">{copy("Communiqués datés de la Central Bank of Trinidad and Tobago, à consulter directement à la source.", HOME_EN.newsDescription)}</p>
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
                   <time dateTime={item.date} className="text-caption text-primary-foreground/65">{dateFormatter.format(new Date(item.date))} · {copy("Banque centrale", HOME_EN.centralBank)}</time>
                   <h3 className="text-heading-sm mt-2 text-primary-foreground">{en ? HOME_EN.news[index]?.[0] : item.title}</h3>
                   {index === 0 && <p className="text-body-sm mt-2 text-primary-foreground/75">{en ? HOME_EN.news[index]?.[1] : item.summary}</p>}
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
           eyebrow={copy("Chez nous", HOME_EN.placesEyebrow)}
           title={copy("Ancrée à Trinidad-et-Tobago", HOME_EN.placesTitle)}
           description={copy("De Port of Spain à la côte nord, les lieux qui entourent notre siège.", HOME_EN.placesDescription)}
        />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
          {PLACE_PHOTOS.map((photo) => (
            <figure key={photo.src} className="min-w-0">
              <img
                src={photo.src}
                 alt={en ? (photo === PLACE_PHOTOS[0] ? "Queen's Park Savannah in Port of Spain" : "Maracas Bay on Trinidad's north coast") : photo.alt}
                loading="lazy"
               className="aspect-[3/2] w-full object-cover transition-transform duration-500 motion-safe:hover:scale-[1.01]"
              />
              <figcaption className="mt-2 flex flex-wrap justify-between gap-2">
                 <span className="text-caption text-foreground">{en ? photo.caption.replace("côte nord de Trinidad", "Trinidad's north coast") : photo.caption}</span>
                <PhotoCredit photo={photo} />
              </figcaption>
            </figure>
          ))}
        </div>
      </PublicSection>

      {/* Benefits */}
      <PublicSection tone="sunken">
         <SectionHeader eyebrow={copy("Au quotidien", HOME_EN.daily)} title={copy("Votre compte, simplement", HOME_EN.accountTitle)} />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
           {CORE_BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.title} className="border-t-2 border-brand bg-surface p-5 transition-transform motion-safe:hover:-translate-y-1">
                <Icon className="size-6 text-brand" aria-hidden="true" />
                 <h3 className="text-heading-sm mt-4 text-foreground">{en ? HOME_EN.benefits[index]?.[0] : benefit.title}</h3>
                 <p className="text-body-sm mt-2 text-muted-foreground">{en ? HOME_EN.benefits[index]?.[1] : benefit.description}</p>
              </article>
            );
          })}
        </div>
      </PublicSection>

      {/* Security */}
      <PublicSection>
        <SectionHeader
           eyebrow={copy("Sécurité", HOME_EN.security)}
           title={copy("Votre compte est protégé à chaque étape", HOME_EN.securityTitle)}
          actions={
            <Button asChild variant="outline" className="touch-target">
               <Link to="/security">{copy("Voir la page sécurité", HOME_EN.securityLink)}</Link>
            </Button>
          }
        />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
           {SECURITY_HIGHLIGHTS.map((item, index) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="flex gap-4 border-b border-border py-5">
                <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
                <div className="min-w-0">
                   <h3 className="text-heading-sm text-foreground">{en ? HOME_EN.highlights[index]?.[0] : item.title}</h3>
                   <p className="text-body-sm mt-1 text-muted-foreground">{en ? HOME_EN.highlights[index]?.[1] : item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </PublicSection>

      {/* Onboarding */}
      <PublicSection tone="sunken">
         <SectionHeader eyebrow={copy("Ouverture de compte", HOME_EN.onboarding)} title={copy("Cinq étapes, entièrement en ligne", HOME_EN.onboardingTitle)} />
        <ol className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ONBOARDING_STEPS.map((step, index) => (
            <li key={step.title} className="border-t border-border p-5">
              <span className="text-numeric text-caption inline-flex size-7 items-center justify-center rounded-full bg-brand text-brand-foreground">
                {index + 1}
              </span>
               <h3 className="text-label mt-3 text-foreground">{en ? HOME_EN.steps[index]?.[0] : step.title}</h3>
               <p className="text-caption mt-1 text-muted-foreground">{en ? HOME_EN.steps[index]?.[1] : step.description}</p>
            </li>
          ))}
        </ol>
      </PublicSection>

      {/* FAQ */}
      <PublicSection>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
             eyebrow={copy("Questions fréquentes", HOME_EN.faq)}
             title={copy("Les réponses les plus demandées", HOME_EN.faqTitle)}
            actions={
              <Button asChild variant="outline" className="touch-target">
                 <Link to="/help">{copy("Centre d'aide", HOME_EN.faqLink)}</Link>
              </Button>
            }
          />
           <FaqSection items={en ? HOME_EN.faqs.map(([question, answer]) => ({ question, answer })) : HOME_FAQ} idPrefix="home-faq" />
        </div>
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
