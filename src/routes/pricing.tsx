import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { PricingTable } from "@/features/public/components/PricingTable";
import { CtaSection } from "@/features/public/components/CtaSection";
import { publicMeta } from "@/features/public/lib/seo";
import { PRICING_CATEGORIES, PRICING_DISCLAIMER } from "@/features/public/content/pricing";

const meta = publicMeta({
  title: "Tarifs et conditions",
  description:
    "Structure tarifaire du compte courant RFC : tenue de compte, virements, relevés et assistance. Conditions définitives publiées avant l'ouverture commerciale.",
  path: "/pricing",
});

export const Route = createFileRoute("/pricing")({
  head: () => meta,
  component: PricingPage,
});

function PricingPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Tarifs"
        title="Une grille tarifaire lisible, sans surprise"
        description="Chaque ligne tarifaire est présentée explicitement. Les montants non encore arrêtés sont affichés comme « à définir » plutôt que devinés."
      />

      <PublicSection>
        <div
          className="flex gap-3 rounded-xl border border-info/30 bg-info-muted px-4 py-3"
          role="note"
        >
          <Info className="mt-0.5 size-5 shrink-0 text-info" aria-hidden="true" />
          <p className="text-body-sm text-foreground">{PRICING_DISCLAIMER}</p>
        </div>

        <SectionHeader
          className="mt-10"
          eyebrow="Détail"
          title="Conditions tarifaires par catégorie"
        />
        <PricingTable className="mt-6" categories={PRICING_CATEGORIES} />
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
