import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { englishLegalDocument } from "@/features/public/content/details-en";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection } from "@/features/public/components/SectionHeader";
import { LegalDocumentView } from "@/features/public/components/LegalDocumentView";
import { publicMeta } from "@/features/public/lib/seo";
import { TERMS_DOCUMENT } from "@/features/public/content/legal";

const meta = publicMeta({
  title: "Conditions générales",
  description:
    "Cadre contractuel de la relation bancaire : ouverture de compte, services fournis, opérations, tarifs, responsabilités et clôture.",
  path: "/terms",
});

export const Route = createFileRoute("/terms")({
  head: () => meta,
  component: TermsPage,
});

function TermsPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const document = en ? englishLegalDocument(TERMS_DOCUMENT) : TERMS_DOCUMENT;
  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "Legal information" : "Informations légales"}
        title={document.title}
        description={document.intro}
      />
      <PublicSection>
        <LegalDocumentView document={document} />
      </PublicSection>
    </PublicLayout>
  );
}
