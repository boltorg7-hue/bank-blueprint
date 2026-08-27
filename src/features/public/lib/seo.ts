/**
 * PUBLIC SEO HELPERS (PROMPT 02 §56).
 * One canonical source for public page metadata: unique title, description,
 * Open Graph and canonical link.
 */
import { APP_CONFIG } from "@/config/app";
import { LEGAL_IDENTITY } from "@/features/public/content/site";

export function publicMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  const fullTitle = `${title} — ${APP_CONFIG.name}`;
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:url", content: path },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    // Relative canonical: resolved against the serving host, so it stays
    // correct on preview and on the published domain.
    links: [{ rel: "canonical", href: path }],
  };
}

/**
 * Site-wide Organization structured data. Built from the SAME legal identity
 * source as the header, footer, contact and legal pages so search engines and
 * the rendered pages can never disagree.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "BankOrCreditUnion",
    name: LEGAL_IDENTITY.legalEntity,
    alternateName: APP_CONFIG.name,
    description: APP_CONFIG.description,
    foundingDate: APP_CONFIG.foundedOn,
    identifier: LEGAL_IDENTITY.registrationNumber,
    address: {
      "@type": "PostalAddress",
      streetAddress: "St. Clair Place, 7-8 St. Clair Avenue",
      addressLocality: "Port of Spain",
      postalCode: "107289",
      addressCountry: "TT",
    },
    email: APP_CONFIG.supportEmail,
    ...(LEGAL_IDENTITY.swiftBic ? { globalLocationNumber: undefined } : {}),
  };
}


/** Structured data for the FAQ blocks (§59) — only real published answers. */
export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }),
      },
    ],
  };
}
