import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock3, FileText, Smartphone } from "lucide-react";

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

const SECTION_ICONS = [Smartphone, Clock3, FileText] as const;

function AccountsPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const available = (en ? accountsEn.products : ACCOUNT_PRODUCTS).filter(
    (product) => product.available,
  );
  const sections = en ? accountsEn.sections : ACCOUNT_SECTIONS;
  const business = en ? accountsEn.business : BUSINESS_RESERVED;

  return (
    <PublicLayout>
      <PageHero
        className="bg-surface"
        eyebrow={en ? "Accounts" : "Comptes"}
        title={
          en
            ? "A current account for everyday banking"
            : "Un compte courant conçu pour le quotidien"
        }
        description={
          en
            ? "One clear account offering today. Additional products will appear here when they are defined."
            : "Une offre unique et lisible aujourd’hui. Les produits complémentaires seront présentés ici lorsqu’ils seront définis."
        }
        aside={<AccountPreview compact />}
      />

      <PublicSection className="py-12 sm:py-16">
        <SectionHeader
          eyebrow={en ? "Available account" : "Offre disponible"}
          title={en ? "Personal current account" : "Le compte courant particulier"}
          description={
            en
              ? "Detailed charges are published on the Pricing page."
              : "Les conditions tarifaires détaillées sont publiées sur la page Tarifs."
          }
        />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          {available.map((product) => (
            <AccountProductCard
              key={product.id}
              product={product}
              className="rounded-3xl transition-all duration-200 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[var(--shadow-elevated)]"
            />
          ))}
          <article className="group flex flex-col justify-center rounded-3xl border border-dashed border-border bg-surface-sunken p-6 transition-all duration-200 hover:border-brand/40 hover:bg-surface sm:p-8">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-muted text-brand transition-transform duration-200 group-hover:scale-105">
              <span className="text-heading-sm" aria-hidden="true">＋</span>
            </span>
            <h3 className="text-heading-sm mt-5 text-foreground">{business.title}</h3>
            <p className="text-body-sm mt-2 max-w-md text-muted-foreground">
              {business.description}
            </p>
            <p className="text-caption mt-5 border-t border-border pt-4 text-muted-foreground">
              {en ? "Future offering" : "Offre future"}
            </p>
          </article>
        </div>
      </PublicSection>

      <PublicSection
        tone="sunken"
        className="border-y border-border py-12 sm:py-16"
      >
        <SectionHeader
          eyebrow={en ? "In practice" : "En pratique"}
          title={
            en
              ? "What you can do with your account"
              : "Ce que le compte vous permet de faire"
          }
          description={
            en
              ? "The essential services are grouped into clear, easy-to-find areas."
              : "Les services essentiels sont regroupés dans des espaces clairs et faciles à retrouver."
          }
        />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
          {sections.map((section, index) => {
            const Icon = SECTION_ICONS[index] ?? Check;
            return (
              <article
                key={section.title}
                className="group rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[var(--shadow-elevated)] sm:rounded-3xl sm:p-6"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-muted text-brand transition-transform duration-200 group-hover:scale-105">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-heading-sm mt-4 text-foreground">
                  {section.title}
                </h3>
                <p className="text-body-sm mt-2 text-muted-foreground">
                  {section.description}
                </p>
                <ul className="mt-5 space-y-3 border-t border-border pt-4">
                  {section.points.map((point) => (
                    <li
                      key={point}
                      className="text-body-sm flex items-start gap-2.5 text-foreground"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
