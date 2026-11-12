import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { aboutEn } from "@/features/public/content/details-en";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { CtaSection } from "@/features/public/components/CtaSection";
import { publicMeta } from "@/features/public/lib/seo";
import {
  ABOUT_COMMITMENT,
  ABOUT_GOVERNANCE,
  ABOUT_INTRO,
  ABOUT_SECTIONS,
  ABOUT_VALUES,
} from "@/features/public/content/about";

const meta = publicMeta({
  title: "À propos de la banque",
  description:
    "Notre mission, notre approche de la banque et nos engagements : rendre chaque opération traçable, chaque contrôle explicable et chaque document retrouvable.",
  path: "/about",
});

export const Route = createFileRoute("/about")({
  head: () => meta,
  component: AboutPage,
});

function AboutPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const intro = en ? aboutEn.intro : ABOUT_INTRO;
  const sections = en
    ? ABOUT_SECTIONS.map((section, index) => ({
        ...section,
        ...aboutEn.sections[index],
      }))
    : ABOUT_SECTIONS;
  const values = en
    ? ABOUT_VALUES.map((value, index) => ({
        ...value,
        title: aboutEn.values[index]?.[0] ?? value.title,
        description: aboutEn.values[index]?.[1] ?? value.description,
      }))
    : ABOUT_VALUES;
  const commitment = en ? aboutEn.commitment : ABOUT_COMMITMENT;
  const governance = en ? aboutEn.governance : ABOUT_GOVERNANCE;

  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "About us" : "À propos"}
        title={intro.title}
        description={intro.description}
      />

      <PublicSection>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          <nav
            aria-label={en ? "Page sections" : "Sections de la page"}
            className="h-fit rounded-2xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-24"
          >
            <p className="text-overline text-muted-foreground">
              {en ? "On this page" : "Sur cette page"}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col">
              {sections.map((section) => (
                <li key={section.id} className="min-w-0">
                  <a
                    href={`#${section.id}`}
                    className="text-body-sm block rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-5">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-7"
              >
                <div className="flex items-start gap-4">
                  <span className="text-overline flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 space-y-3">
                    <h2 className="text-heading-md text-foreground">{section.title}</h2>
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p
                        key={paragraphIndex}
                        className="text-body max-w-prose text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </PublicSection>

      <PublicSection tone="sunken">
        <SectionHeader
          eyebrow={en ? "Our values" : "Nos valeurs"}
          title={en ? "What guides our decisions" : "Ce qui guide nos décisions produit"}
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => (
            <article
              key={value.title}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
            >
              <span className="text-overline inline-flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-heading-sm mt-4 text-foreground">{value.title}</h3>
              <p className="text-body-sm mt-2 text-muted-foreground">{value.description}</p>
            </article>
          ))}
        </div>
      </PublicSection>

      <PublicSection>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
            <SectionHeader
              as="h2"
              eyebrow={en ? "Commitment" : "Engagement"}
              title={commitment.title}
            />
            <ul className="mt-6 space-y-4">
              {commitment.points.map((point) => (
                <li key={point} className="text-body-sm flex items-start gap-3 text-foreground">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success/10">
                    <Check className="size-3.5 text-success" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-surface-sunken p-6 shadow-sm sm:p-7">
            <div className="absolute inset-y-0 left-0 w-1 bg-brand" aria-hidden="true" />
            <div className="pl-3">
              <p className="text-overline text-brand">{en ? "Governance" : "Gouvernance"}</p>
              <h2 className="text-heading-sm mt-3 text-foreground">{governance.title}</h2>
              <p className="text-body-sm mt-3 max-w-prose text-muted-foreground">
                {governance.description}
              </p>
            </div>
          </div>
        </div>
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
