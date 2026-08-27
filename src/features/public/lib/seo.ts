/**
 * PUBLIC SEO HELPERS (PROMPT 02 §56).
 * One canonical source for public page metadata: unique title, description,
 * Open Graph and canonical link.
 */
import { APP_CONFIG } from "@/config/app";

const SITE_ORIGIN = "https://vaultis.example";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_ORIGIN}${path}` }],
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
