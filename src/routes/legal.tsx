import { createFileRoute, Link } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
import { LEGAL_IDENTITY_NOTICE } from "@/features/public/content/site";
import { LegalIdentityList } from "@/features/public/components/LegalIdentityList";

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
  const { language } = useLanguage();
  const en = language === "en";
  const linksEn = [
    ["Terms and conditions", "The contractual basis of your banking relationship."],
    ["Privacy policy", "How your personal data is used and protected."],
    ["Pricing", "Charges applicable to accounts and transactions."],
    ["Security", "Protecting your account and good security habits."],
  ];
  const cookiesEn = [
    ["Theme preference", "Remember your light or dark appearance choice.", "Browser local storage"],
    ["Privacy mode", "Remember whether amounts are hidden on screen.", "Browser local storage"],
    ["Sign-in session", "Keep you signed in to your customer account.", "Cookie / secure storage"],
  ];

  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "Legal information" : "Informations légales"}
        title={en ? "Legal center" : "Centre légal"}
        description={
          en
            ? "Your legal documents and regulatory information in one place."
            : "Tous les documents et informations réglementaires réunis au même endroit."
        }
      />

      <PublicSection>
        <SectionHeader
          eyebrow={en ? "Documents" : "Documents"}
          title={en ? "Documents and policies" : "Documents et politiques"}
        />
        <ul className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          {LEGAL_HUB_LINKS.map((link, index) => (
            <li key={link.label}>
              <Link
                to={link.to}
                className="group flex h-full items-start justify-between gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span className="min-w-0">
                  <span className="text-heading-sm block text-foreground">
                    {en ? linksEn[index]?.[0] : link.label}
                  </span>
                  <span className="text-body-sm mt-1 block text-muted-foreground">
                    {en ? linksEn[index]?.[1] : link.description}
                  </span>
                </span>
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">
                  <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PublicSection>

      <PublicSection tone="sunken">
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="min-w-0">
            <SectionHeader
              as="h2"
              eyebrow={en ? "Technology" : "Technologies"}
              title={en ? "Cookies and local storage" : "Cookies et stockage local"}
              description={
                COOKIE_POSTURE.usesOptionalTracking
                  ? en
                    ? "Optional technologies are in use; your consent is required."
                    : "Des technologies optionnelles sont utilisées ; votre consentement est requis."
                  : en
                    ? "This site only uses strictly necessary technologies. No consent banner is shown because there are no optional technologies to accept."
                    : "Le site n’utilise que des technologies strictement nécessaires. Aucune bannière de consentement n’est affichée car il n’y a rien d’optionnel à accepter."
              }
            />
            <ul className="mt-6 space-y-3">
              {COOKIE_POSTURE.strictlyNecessary.map((item, index) => (
                <li
                  key={item.name}
                  className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
                >
                  <p className="text-label text-foreground">
                    {en ? cookiesEn[index]?.[0] : item.name}
                  </p>
                  <p className="text-body-sm mt-1 text-muted-foreground">
                    {en ? cookiesEn[index]?.[1] : item.purpose}
                  </p>
                  <p className="text-caption mt-1 text-muted-foreground">
                    {en ? cookiesEn[index]?.[2] : item.storage}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 space-y-8">
            <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <h2 className="text-heading-sm text-foreground">
                {en ? "Accessibility statement" : ACCESSIBILITY_STATEMENT.title}
              </h2>
              <p className="text-body-sm mt-2 max-w-prose text-muted-foreground">
                {en
                  ? "We aim for WCAG 2.2 AA: keyboard navigation, sufficient contrast, visible focus, reduced-motion support and screen-reader compatibility. Please report accessibility issues through the Contact page."
                  : ACCESSIBILITY_STATEMENT.description}
              </p>
            </section>

            <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
              <h2 className="text-heading-sm text-foreground">
                {en ? "Bank contact details" : "Coordonnées de la banque"}
              </h2>
              <LegalIdentityList className="mt-4 rounded-xl border border-border/70 bg-surface-sunken/50 p-4" />
              <p className="text-caption mt-3 text-muted-foreground">{LEGAL_IDENTITY_NOTICE}</p>
            </section>
          </div>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
