import { useLanguage } from "@/components/providers/LanguageProvider";
import { PENDING_SECTION_NOTICE, type LegalDocument } from "@/features/public/content/legal";
import { formatDate } from "@/lib/format/date";

/**
 * Renders the legal document structure without inventing legal wording.
 * Empty sections explain which topics will be covered in the next publication.
 */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[220px_1fr]">
      <nav
        aria-label={en ? "Document contents" : "Sommaire du document"}
        className="lg:sticky lg:top-24 lg:self-start"
      >
        <p className="text-overline text-muted-foreground">{en ? "Contents" : "Sommaire"}</p>
        <ul className="mt-3 space-y-1">
          {document.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-body-sm block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-foreground"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-8">
        <p className="text-body max-w-prose text-muted-foreground">{document.intro}</p>
        <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-brand/15 bg-brand/[0.06] px-3 py-1.5 text-caption font-medium text-foreground">
          <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
          {document.lastUpdated
            ? `${en ? "Last updated" : "Dernière mise à jour"}: ${formatDate(document.lastUpdated)}`
            : en
              ? "Publication update in preparation"
              : "Mise à jour avant publication"}
        </div>

        {document.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
            <h2 className="text-heading-sm text-foreground">{section.title}</h2>
            {section.paragraphs.length > 0 ? (
              section.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-body-sm max-w-prose text-muted-foreground">
                  {paragraph}
                </p>
              ))
            ) : (
              <div className="flex max-w-3xl items-start gap-3 rounded-xl border border-border/70 bg-surface-sunken/70 px-4 py-4">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-card text-brand shadow-sm">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 8v4l2.5 1.5M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
                  </svg>
                </span>
                <p className="text-body-sm text-muted-foreground">
                  {en
                    ? "This topic is included in the current document update. Its detailed information will be added to the consolidated version after review."
                    : PENDING_SECTION_NOTICE}
                </p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
