import { createFileRoute } from "@tanstack/react-router";

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
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Informations légales"
        title={PRIVACY_DOCUMENT.title}
        description={PRIVACY_DOCUMENT.intro}
      />
      <PublicSection>
        <LegalDocumentView document={PRIVACY_DOCUMENT} />
      </PublicSection>
    </PublicLayout>
  );
}
