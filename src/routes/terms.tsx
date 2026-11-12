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
    "Découvrez le cadre contractuel en préparation : ouverture de compte, services, opérations, tarifs, responsabilités et clôture.",
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

  const commitments = en
    ? [
        {
          title: "A clear framework",
          description:
            "The document will explain the conditions for opening and using an account, and the services covered.",
          icon: "document",
        },
        {
          title: "Shared responsibilities",
          description:
            "The respective commitments of the customer and the institution will be stated in plain language.",
          icon: "balance",
        },
        {
          title: "Careful review in progress",
          description:
            "The terms are being carefully reviewed, and their publication and effective dates will be clearly displayed when finalized.",
          icon: "review",
        },
      ]
    : [
        {
          title: "Un cadre compréhensible",
          description:
            "Le document expliquera les conditions d’ouverture et d’utilisation d’un compte ainsi que les services concernés.",
          icon: "document",
        },
        {
          title: "Des responsabilités réciproques",
          description:
            "Les engagements du client et de l’établissement seront présentés dans un langage clair.",
          icon: "balance",
        },
        {
          title: "Une relecture attentive en cours",
          description:
            "Les conditions font l’objet d’une relecture attentive ; leurs dates de publication et d’entrée en vigueur seront clairement affichées une fois la finalisation terminée.",
          icon: "review",
        },
      ];

  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "Legal information and transparency" : "Informations légales et transparence"}
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
                  <path d="M4 7.5h16M6.5 4.5h11A1.5 1.5 0 0 1 19 6v14H5V6a1.5 1.5 0 0 1 1.5-1.5Z" />
                  <path d="M8 11h8M8 14.5h8M8 18h4" />
                </svg>
              </span>
              <div className="min-w-0 space-y-2">
                <p className="text-overline font-semibold text-brand">
                  {en
                    ? "Legal document review in progress"
                    : "Relecture et validation en cours"}
                </p>
                <h2 className="text-heading-md text-foreground">
                  {en
                    ? "We are preparing clear terms for your banking relationship"
                    : "Nous préparons des conditions claires pour votre relation bancaire"}
                </h2>
                <p className="text-body-sm max-w-3xl text-muted-foreground">
                  {en
                    ? "The topics below outline the contractual framework being prepared. The complete terms will be published only after review and approval, with their effective date clearly stated."
                    : "Les rubriques ci-dessous présentent le cadre contractuel en préparation. Les conditions complètes seront publiées uniquement après relecture et validation, avec une date d’entrée en vigueur clairement indiquée."}
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
                  ) : item.icon === "balance" ? (
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
                      <path d="M12 3v18M5 7h14M7 7l-4 7h8L7 7ZM17 7l-4 7h8l-4-7ZM8 21h8" />
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
                      <path d="m12 3 7 3v5c0 4.2-2.7 7.4-7 10-4.3-2.6-7-5.8-7-10V6l7-3Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  )}
                </span>
                <h3 className="text-heading-sm text-foreground">{item.title}</h3>
                <p className="text-body-sm mt-2 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-8 lg:p-10">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-5">
              <div className="space-y-1">
                <p className="text-overline text-muted-foreground">
                  {en ? "Contractual framework" : "Cadre contractuel"}
                </p>
                <p className="text-body-sm text-muted-foreground">
                  {en
                    ? "Explore the topics that will be covered in the final document."
                    : "Retrouvez les sujets qui seront détaillés dans le document définitif."}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-border bg-surface-sunken px-3 py-1 text-caption font-medium text-muted-foreground">
                {en ? "Review in progress" : "Finalisation en cours"}
              </span>
            </div>
            <LegalDocumentView document={document} />
          </div>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
