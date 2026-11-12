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
        <div className="mx-auto max-w-7xl rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-md motion-reduce:transition-none sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-5">
            <div className="space-y-1">
              <p className="text-overline text-muted-foreground">
                {en ? "Contractual framework" : "Cadre contractuel"}
              </p>
              <p className="text-body-sm text-muted-foreground">
                {en
                  ? "Review the document structure and its publication status."
                  : "Consultez la structure du document et son état de publication."}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-border bg-surface-sunken px-3 py-1 text-caption font-medium text-muted-foreground">
              {en ? "Legal document" : "Document juridique"}
            </span>
          </div>
          <LegalDocumentView document={document} />
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
