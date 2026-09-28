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
  const sections = en ? ABOUT_SECTIONS.map((section, index) => ({ ...section, ...aboutEn.sections[index] })) : ABOUT_SECTIONS;
  const values = en ? ABOUT_VALUES.map((value, index) => ({ ...value, title: aboutEn.values[index]?.[0] ?? value.title, description: aboutEn.values[index]?.[1] ?? value.description })) : ABOUT_VALUES;
  const commitment = en ? aboutEn.commitment : ABOUT_COMMITMENT;
  const governance = en ? aboutEn.governance : ABOUT_GOVERNANCE;
  return (
    <PublicLayout>
      <PageHero eyebrow={en ? "About us" : "À propos"} title={intro.title} description={intro.description} />

      <PublicSection>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[220px_1fr]">
          <nav aria-label={en ? "Page sections" : "Sections de la page"} className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-overline text-muted-foreground">{en ? "On this page" : "Sur cette page"}</p>
            <ul className="mt-3 space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-body-sm block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-foreground"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-12">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 border-t border-border pt-6 sm:grid sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-5">
                <span className="text-overline mb-3 block text-brand">{String(index + 1).padStart(2, "0")}</span>
                <div className="space-y-3">
                <h2 className="text-heading-md text-foreground">{section.title}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-body max-w-prose text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </PublicSection>

      <PublicSection tone="sunken">
        <SectionHeader eyebrow={en ? "Our values" : "Nos valeurs"} title={en ? "What guides our decisions" : "Ce qui guide nos décisions produit"} />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value) => (
            <article key={value.title} className="border-t-2 border-brand py-5">
              <h3 className="text-heading-sm text-foreground">{value.title}</h3>
              <p className="text-body-sm mt-2 text-muted-foreground">{value.description}</p>
            </article>
          ))}
        </div>
      </PublicSection>

      <PublicSection>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
          <div className="min-w-0">
            <SectionHeader as="h2" eyebrow={en ? "Commitment" : "Engagement"} title={commitment.title} />
            <ul className="mt-5 space-y-3">
              {commitment.points.map((point) => (
                <li key={point} className="text-body-sm flex gap-2 text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span className="min-w-0">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 border-l-2 border-brand bg-surface-sunken p-6">
            <h2 className="text-heading-sm text-foreground">{governance.title}</h2>
            <p className="text-body-sm mt-2 text-muted-foreground">{governance.description}</p>
          </div>
        </div>
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
