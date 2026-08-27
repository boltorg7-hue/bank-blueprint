import { createFileRoute } from "@tanstack/react-router";

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
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Informations légales"
        title={TERMS_DOCUMENT.title}
        description={TERMS_DOCUMENT.intro}
      />
      <PublicSection>
        <LegalDocumentView document={TERMS_DOCUMENT} />
      </PublicSection>
    </PublicLayout>
  );
}
