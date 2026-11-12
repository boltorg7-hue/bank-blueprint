import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { englishLegalDocument } from "@/features/public/content/details-en";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection } from "@/features/public/components/SectionHeader";
import { LegalDocumentView } from "@/features/public/components/LegalDocumentView";
import { publicMeta } from "@/features/public/lib/seo";
import { PRIVACY_DOCUMENT } from "@/features/public/content/legal";

const meta = publicMeta({
  title: "Politique de confidentialité",
  description:
    "Données collectées, finalités du traitement, destinataires, durée de conservation, sécurité et droits dont vous disposez.",
  path: "/privacy",
});

export const Route = createFileRoute("/privacy")({
  head: () => meta,
  component: PrivacyPage,
});

function PrivacyPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const document = en ? englishLegalDocument(PRIVACY_DOCUMENT) : PRIVACY_DOCUMENT;
  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "Legal information" : "Informations légales"}
        title={document.title}
        description={document.intro}
      />
      <PublicSection>
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-start gap-4 rounded-2xl border border-border/70 bg-surface-sunken p-5 sm:p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="size-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3 19 6v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-overline text-muted-foreground">
                {en ? "Privacy and data protection" : "Confidentialité et protection des données"}
              </p>
              <p className="text-body-sm text-muted-foreground">
                {en
                  ? "This page presents the published privacy document and clearly identifies sections that are still pending."
                  : "Cette page présente le document de confidentialité publié et identifie clairement les sections encore en attente."}
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-md motion-reduce:transition-none sm:p-8 lg:p-10">
            <LegalDocumentView document={document} />
          </div>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
