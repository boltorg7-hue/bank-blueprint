import { useLiveFinancialSettings } from "@/features/settings/useLiveFinancialSettings";
import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { PricingTable } from "@/features/public/components/PricingTable";
import { CtaSection } from "@/features/public/components/CtaSection";
import { publicMeta } from "@/features/public/lib/seo";
import { buildPricingCategories, PRICING_DISCLAIMER } from "@/features/public/content/pricing";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();
  const en = language === "en";
  useLiveFinancialSettings();
  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "Pricing" : "Tarifs"}
        title={en ? "Clear pricing, no surprises" : "Une grille tarifaire lisible, sans surprise"}
        description={en ? "Every charge is listed clearly. Amounts not yet confirmed are marked as such, never estimated." : "Chaque ligne tarifaire est présentée explicitement. Les montants non encore arrêtés sont affichés comme « à définir » plutôt que devinés."}
      />

      <PublicSection>
        <div
          className="flex gap-3 rounded-xl border border-info/30 bg-info-muted px-4 py-3"
          role="note"
        >
          <Info className="mt-0.5 size-5 shrink-0 text-info" aria-hidden="true" />
          <p className="text-body-sm text-foreground">{en ? "Final pricing terms will be published here before commercial launch. Unconfirmed amounts are not a commitment. Accounts are held in US dollars (USD); an amount entered in USDT is converted to USD before execution, with the conversion shown before confirmation." : PRICING_DISCLAIMER}</p>
        </div>

        <SectionHeader
          className="mt-10"
          eyebrow={en ? "Details" : "Détail"}
          title={en ? "Charges by category" : "Conditions tarifaires par catégorie"}
        />
        <PricingTable className="mt-6" categories={buildPricingCategories()} />
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
