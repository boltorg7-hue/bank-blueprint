import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { publicMeta } from "@/features/public/lib/seo";
import {
  ACCESSIBILITY_STATEMENT,
  COOKIE_POSTURE,
  LEGAL_HUB_LINKS,
} from "@/features/public/content/legal";
import { LEGAL_IDENTITY } from "@/features/public/content/site";

const meta = publicMeta({
  title: "Informations légales",
  description:
    "Centre légal : conditions générales, politique de confidentialité, technologies utilisées, accessibilité et identité de l'entité exploitante.",
  path: "/legal",
});

export const Route = createFileRoute("/legal")({
  head: () => meta,
  component: LegalPage,
});

function LegalPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Informations légales"
        title="Centre légal"
        description="Tous les documents et informations réglementaires réunis au même endroit."
      />

      <PublicSection>
        <SectionHeader eyebrow="Documents" title="Documents et politiques" />
        <ul className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          {LEGAL_HUB_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                className="flex h-full items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand/40"
              >
                <span className="min-w-0">
                  <span className="text-heading-sm block text-foreground">{link.label}</span>
                  <span className="text-body-sm mt-1 block text-muted-foreground">
                    {link.description}
                  </span>
                </span>
                <ArrowRight className="mt-1 size-5 shrink-0 text-brand" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </PublicSection>

      <PublicSection tone="sunken">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-2">
          <div className="min-w-0">
            <SectionHeader
              as="h2"
              eyebrow="Technologies"
              title="Cookies et stockage local"
              description={
                COOKIE_POSTURE.usesOptionalTracking
                  ? "Des technologies optionnelles sont utilisées ; votre consentement est requis."
                  : "Le site n'utilise que des technologies strictement nécessaires. Aucune bannière de consentement n'est affichée car il n'y a rien d'optionnel à accepter."
              }
            />
            <ul className="mt-6 space-y-3">
              {COOKIE_POSTURE.strictlyNecessary.map((item) => (
                <li key={item.name} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-label text-foreground">{item.name}</p>
                  <p className="text-body-sm mt-1 text-muted-foreground">{item.purpose}</p>
                  <p className="text-caption mt-1 text-muted-foreground">{item.storage}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 space-y-8">
            <section>
              <h2 className="text-heading-sm text-foreground">{ACCESSIBILITY_STATEMENT.title}</h2>
              <p className="text-body-sm mt-2 max-w-prose text-muted-foreground">
                {ACCESSIBILITY_STATEMENT.description}
              </p>
            </section>

            <section>
              <h2 className="text-heading-sm text-foreground">Coordonnées de la banque</h2>
              <LegalIdentityList className="mt-4 rounded-2xl border border-border bg-surface p-5" />
              <p className="text-caption mt-3 text-muted-foreground">{LEGAL_IDENTITY_NOTICE}</p>
            </section>

          </div>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
