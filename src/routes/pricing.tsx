import { useLiveFinancialSettings } from "@/features/settings/useLiveFinancialSettings";
import { createFileRoute } from "@tanstack/react-router";
import { Info, ShieldCheck } from "lucide-react";

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
  const categories = buildPricingCategories();

  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "Pricing" : "Tarifs"}
        title={en ? "Clear pricing, no surprises" : "Une grille tarifaire lisible, sans surprise"}
        description={
          en
            ? "Every charge is listed clearly. Amounts not yet confirmed are marked as such, never estimated."
            : "Chaque ligne tarifaire est présentée explicitement. Les montants non encore arrêtés sont affichés comme « à définir » plutôt que devinés."
        }
        aside={
          <div className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 via-surface to-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div
              className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full border border-brand/10"
              aria-hidden="true"
            />
            <div className="relative">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand/10">
                <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
              </span>
              <h2 className="text-heading-sm mt-5 text-foreground">
                {en ? "No invented amounts" : "Aucun montant inventé"}
              </h2>
              <p className="text-body-sm mt-2 text-muted-foreground">
                {en
                  ? "Only confirmed fees are shown as amounts. Pending fees remain clearly marked as to be confirmed."
                  : "Seuls les frais confirmés sont affichés comme des montants. Les frais en attente restent clairement indiqués comme « à définir »."}
              </p>
              <span className="mt-5 inline-flex items-center rounded-full border border-brand/20 bg-surface/80 px-3 py-1.5 text-caption font-medium text-brand">
                {en ? "Transparent fee schedule" : "Grille tarifaire transparente"}
              </span>
            </div>
          </div>
        }
      />

      <PublicSection>
        <div
          className="flex gap-3 rounded-2xl border border-info/30 bg-info-muted/70 px-4 py-4 shadow-[var(--shadow-subtle)] sm:px-5"
          role="note"
        >
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-info/10">
            <Info className="size-5 text-info" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-foreground">
              {en ? "Important information" : "Information importante"}
            </p>
            <p className="text-body-sm mt-1 text-foreground">
              {en
                ? "Final pricing terms will be published here before commercial launch. Unconfirmed amounts are not a commitment. Accounts are held in US dollars (USD); an amount entered in USDT is converted to USD before execution, with the conversion shown before confirmation."
                : PRICING_DISCLAIMER}
            </p>
          </div>
        </div>

        <div className="mt-10">
          <SectionHeader
            eyebrow={en ? "Details" : "Détail"}
            title={en ? "Charges by category" : "Conditions tarifaires par catégorie"}
            description={
              en
                ? "Review each service category and its current published fee status."
                : "Retrouvez les services par catégorie et le statut actuel de chaque frais publié."
            }
          />
          <div className="mt-6">
            <PricingTable categories={categories} />
          </div>
          <p className="text-caption mt-5 text-muted-foreground">
            {en
              ? `${categories.length} service categories · Fees are displayed from the bank's current fee schedule.`
              : `${categories.length} catégories de services · Les frais affichés proviennent de la grille tarifaire actuelle de la banque.`}
          </p>
        </div>
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
