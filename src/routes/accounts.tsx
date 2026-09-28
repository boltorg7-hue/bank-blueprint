import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { accountsEn } from "@/features/public/content/details-en";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { AccountProductCard } from "@/features/public/components/AccountProductCard";
import { CtaSection } from "@/features/public/components/CtaSection";
import { AccountPreview } from "@/features/public/components/ProductPreview";
import { publicMeta } from "@/features/public/lib/seo";
import {
  ACCOUNT_PRODUCTS,
  ACCOUNT_SECTIONS,
  BUSINESS_RESERVED,
} from "@/features/public/content/accounts";

const meta = publicMeta({
  title: "Comptes bancaires",
  description:
    "Le compte courant particulier : solde en temps réel, virements vers vos bénéficiaires, relevés numériques et messagerie sécurisée.",
  path: "/accounts",
});

export const Route = createFileRoute("/accounts")({
  head: () => meta,
  component: AccountsPage,
});

function AccountsPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const available = (en ? accountsEn.products : ACCOUNT_PRODUCTS).filter((product) => product.available);
  const sections = en ? accountsEn.sections : ACCOUNT_SECTIONS;
  const business = en ? accountsEn.business : BUSINESS_RESERVED;

  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "Accounts" : "Comptes"}
        title={en ? "A current account for everyday banking" : "Un compte courant conçu pour le quotidien"}
        description={en ? "One clear account offering today. Additional products will appear here when they are defined." : "Une offre unique et lisible aujourd’hui. Les produits complémentaires seront présentés ici lorsqu’ils seront définis."}
        aside={<AccountPreview compact />}
      />

      <PublicSection>
        <SectionHeader
          eyebrow={en ? "Available account" : "Offre disponible"}
          title={en ? "Personal current account" : "Le compte courant particulier"}
          description={en ? "Detailed charges are published on the Pricing page." : "Les conditions tarifaires détaillées sont publiées sur la page Tarifs."}
        />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          {available.map((product) => (
            <AccountProductCard key={product.id} product={product} />
          ))}
          <article className="flex flex-col justify-center rounded-2xl border border-dashed border-border bg-surface-sunken p-6">
            <h3 className="text-heading-sm text-foreground">{business.title}</h3>
            <p className="text-body-sm mt-2 text-muted-foreground">{business.description}</p>
          </article>
        </div>
      </PublicSection>

      <PublicSection tone="sunken">
        <SectionHeader eyebrow={en ? "In practice" : "En pratique"} title={en ? "What you can do with your account" : "Ce que le compte vous permet de faire"} />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-heading-sm text-foreground">{section.title}</h3>
              <p className="text-body-sm mt-2 text-muted-foreground">{section.description}</p>
              <ul className="mt-4 space-y-2">
                {section.points.map((point) => (
                  <li key={point} className="text-body-sm flex gap-2 text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    <span className="min-w-0">{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
