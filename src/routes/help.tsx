import { createFileRoute, Link } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  HELP_ARTICLES.map((article) => ({
    question: article.question,
    answer: article.answer,
  })),
);

export const Route = createFileRoute("/help")({
  head: () => ({ ...meta, ...jsonLd }),
  component: HelpPage,
});

function HelpPage() {
  const { language } = useLanguage();
  const en = language === "en";

  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "Help" : "Aide"}
        title={en ? "Help center" : "Centre d’aide"}
        description={
          en
            ? "Search by keyword or browse the topics. If you have an account, secure messaging is the most direct way to reach us."
            : "Cherchez par mot-clé ou parcourez les sujets. Si vous êtes client, la messagerie sécurisée de votre espace reste le canal le plus direct."
        }
        actions={
          <Button asChild variant="outline" className="touch-target">
            <Link to="/contact">{en ? "Contact us" : "Nous contacter"}</Link>
          </Button>
        }
      />

      <PublicSection tone="sunken">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-overline text-brand">
                {en ? "Find an answer" : "Trouvez une réponse"}
              </p>
              <h2 className="text-heading-md mt-2 text-foreground">
                {en ? "Browse help topics" : "Parcourir les sujets d’aide"}
              </h2>
            </div>
            <p className="text-body-sm max-w-md text-muted-foreground">
              {en
                ? "Choose a topic or search the answers. You can contact our team if you need more help."
                : "Choisissez un sujet ou recherchez dans les réponses. Vous pouvez contacter notre équipe si vous avez besoin d’aide supplémentaire."}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:p-8">
            <HelpCenter />
          </div>
        </div>
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
