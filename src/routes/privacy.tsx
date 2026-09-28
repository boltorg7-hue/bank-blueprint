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
        <LegalDocumentView document={document} />
      </PublicSection>
    </PublicLayout>
  );
}
