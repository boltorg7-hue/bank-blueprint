import { PENDING_SECTION_NOTICE, type LegalDocument } from "@/features/public/content/legal";
import { formatDate } from "@/lib/format/date";

/**
 * Renders a legal document structure (§47-§49).
 * Sections without published text show an explicit pending notice — the app
 * never fabricates legal wording.
 */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Sommaire du document" className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-overline text-muted-foreground">Sommaire</p>
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
        <p className="text-caption text-muted-foreground">
          {document.lastUpdated
            ? `Dernière mise à jour : ${formatDate(document.lastUpdated)}`
            : "Ce document n'est pas encore publié dans sa version définitive."}
        </p>

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
              <p className="text-body-sm max-w-prose rounded-lg border border-dashed border-border bg-surface-sunken px-4 py-3 text-muted-foreground">
                {PENDING_SECTION_NOTICE}
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
