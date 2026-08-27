import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection } from "@/features/public/components/SectionHeader";
import { HelpCenter } from "@/features/public/components/HelpCenter";
import { CtaSection } from "@/features/public/components/CtaSection";
import { faqJsonLd, publicMeta } from "@/features/public/lib/seo";
import { HELP_ARTICLES } from "@/features/public/content/help";

const meta = publicMeta({
  title: "Centre d'aide",
  description:
    "Réponses aux questions sur l'ouverture de compte, la connexion, les virements, les documents, les relevés et la sécurité.",
  path: "/help",
});

const jsonLd = faqJsonLd(
  HELP_ARTICLES.map((article) => ({ question: article.question, answer: article.answer })),
);

export const Route = createFileRoute("/help")({
  head: () => ({ ...meta, ...jsonLd }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Aide"
        title="Centre d'aide"
        description="Cherchez par mot-clé ou parcourez les sujets. Si vous êtes client, la messagerie sécurisée de votre espace reste le canal le plus direct."
        actions={
          <Button asChild variant="outline" className="touch-target">
            <Link to="/contact">Nous contacter</Link>
          </Button>
        }
      />

      <PublicSection>
        <HelpCenter />
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
