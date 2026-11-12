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
    "Comprendre comment RF BANK prépare l'information relative à la collecte, à l'utilisation et à la protection des données personnelles.",
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

  const commitments = en
    ? [
        {
          title: "Clear information",
          description:
            "The final policy will explain the data concerned, the reasons for processing and the applicable retention periods.",
          icon: "document",
        },
        {
          title: "Careful review",
          description:
            "The wording is being prepared for review so that the published information is clear, consistent and appropriate.",
          icon: "review",
        },
        {
          title: "Visible updates",
          description:
            "The publication date and any later revision date will be shown on this page.",
          icon: "calendar",
        },
      ]
    : [
        {
          title: "Une information claire",
          description:
            "La politique précisera les données concernées, les raisons de leur traitement et les durées de conservation applicables.",
          icon: "document",
        },
        {
          title: "Une relecture attentive",
          description:
            "Le contenu est préparé pour relecture afin de publier des informations claires, cohérentes et adaptées.",
          icon: "review",
        },
        {
          title: "Des mises à jour visibles",
          description:
            "La date de publication et les éventuelles dates de révision seront indiquées sur cette page.",
          icon: "calendar",
        },
      ];

  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "Privacy and transparency" : "Confidentialité et transparence"}
        title={document.title}
        description={document.intro}
      />
      <PublicSection>
        <div className="mx-auto max-w-7xl space-y-7">
          <div className="relative overflow-hidden rounded-3xl border border-brand/15 bg-gradient-to-br from-brand/[0.10] via-card to-surface-sunken p-5 shadow-sm sm:p-7">
            <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-brand/[0.07] blur-2xl" />
            <div className="relative flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3 19 6v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3Z" />
                  <path d="M9 12h6M12 9v6" />
                </svg>
              </span>
              <div className="min-w-0 space-y-2">
                <p className="text-overline font-semibold text-brand">
                  {en ? "Document refresh underway" : "Mise à jour documentaire en cours"}
                </p>
                <h2 className="text-heading-md text-foreground">
                  {en
                    ? "We are preparing a clearer privacy policy"
                    : "Nous préparons une politique de confidentialité plus claire"}
                </h2>
                <p className="text-body-sm max-w-3xl text-muted-foreground">
                  {en
                    ? "Our privacy information is being reviewed and updated. The sections below show the topics that will be explained in the consolidated version, which will be published after review. The page will display its publication date when the update is complete."
                    : "Nos informations relatives à la confidentialité font l’objet d’une relecture et d’une mise à jour. Les rubriques ci-dessous présentent les sujets qui seront expliqués dans la version consolidée, publiée après validation. La date de publication sera affichée ici une fois la mise à jour terminée."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {commitments.map((item) => (
              <article
                key={item.title}
                className="group rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span className="mb-4 grid size-10 place-items-center rounded-xl bg-surface-sunken text-brand transition-colors group-hover:bg-brand/10">
                  {item.icon === "document" ? (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="size-5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 3.75h7l4 4V20a.75.75 0 0 1-.75.75h-10.5A.75.75 0 0 1 6 20V4.5a.75.75 0 0 1 .75-.75Z" />
                      <path d="M14 4v4h4M9 13h6M9 16h6" />
                    </svg>
                  ) : item.icon === "review" ? (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="size-5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m12 3 7 3v5c0 4.2-2.7 7.4-7 10-4.3-2.6-7-5.8-7-10V6l7-3Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="size-5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="4" y="5.5" width="16" height="15" rx="2" />
                      <path d="M8 3.5v4M16 3.5v4M4 10h16M8 14h3" />
                    </svg>
                  )}
                </span>
                <h3 className="text-heading-sm text-foreground">{item.title}</h3>
                <p className="text-body-sm mt-2 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-8 lg:p-10">
            <LegalDocumentView document={document} />
          </div>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
