import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

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
  return (
    <PublicLayout>
      <PageHero eyebrow="À propos" title={ABOUT_INTRO.title} description={ABOUT_INTRO.description} />

      <PublicSection>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[220px_1fr]">
          <nav aria-label="Sections de la page" className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-overline text-muted-foreground">Sur cette page</p>
            <ul className="mt-3 space-y-1">
              {ABOUT_SECTIONS.map((section) => (
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

          <div className="min-w-0 space-y-10">
            {ABOUT_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
                <h2 className="text-heading-md text-foreground">{section.title}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-body max-w-prose text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </PublicSection>

      <PublicSection tone="sunken">
        <SectionHeader eyebrow="Nos valeurs" title="Ce qui guide nos décisions produit" />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ABOUT_VALUES.map((value) => (
            <article key={value.title} className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-heading-sm text-foreground">{value.title}</h3>
              <p className="text-body-sm mt-2 text-muted-foreground">{value.description}</p>
            </article>
          ))}
        </div>
      </PublicSection>

      <PublicSection>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
          <div className="min-w-0">
            <SectionHeader as="h2" eyebrow="Engagement" title={ABOUT_COMMITMENT.title} />
            <ul className="mt-5 space-y-3">
              {ABOUT_COMMITMENT.points.map((point) => (
                <li key={point} className="text-body-sm flex gap-2 text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span className="min-w-0">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 rounded-2xl border border-dashed border-border bg-surface-sunken p-6">
            <h2 className="text-heading-sm text-foreground">{ABOUT_GOVERNANCE.title}</h2>
            <p className="text-body-sm mt-2 text-muted-foreground">{ABOUT_GOVERNANCE.description}</p>
          </div>
        </div>
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
