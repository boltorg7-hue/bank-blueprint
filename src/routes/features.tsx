import { createFileRoute } from "@tanstack/react-router";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { CtaSection } from "@/features/public/components/CtaSection";
import { publicMeta } from "@/features/public/lib/seo";
import { FEATURE_CATEGORIES } from "@/features/public/content/features";
import { PLACE_PHOTOS } from "@/features/public/content/home-heritage";
import { englishFeature } from "@/features/public/content/features-en";
import { useLanguage } from "@/components/providers/LanguageProvider";

const featurePhoto = PLACE_PHOTOS[0];

const meta = publicMeta({
  title: "Fonctionnalités de l'espace client",
  description:
    "Comptes, virements, activité, documents, relevés, sécurité et messagerie : ce que vous pouvez faire depuis votre espace bancaire.",
  path: "/features",
});

export const Route = createFileRoute("/features")({
  head: () => meta,
  component: FeaturesPage,
});

function FeaturesPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const categories = en ? FEATURE_CATEGORIES.map(englishFeature) : FEATURE_CATEGORIES;
  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "Features" : "Fonctionnalités"}
        title={en ? "Your banking, within reach" : "Votre banque, à portée de main"}
        description={en ? "Your accounts, transfers and documents in one place. Follow every transaction from start to finish." : "Vos comptes, vos virements et vos documents se retrouvent dans un seul espace. Chaque opération reste lisible, du début à la fin."}
        aside={featurePhoto ? <figure><img src={featurePhoto.src} alt={en ? "Queen's Park Savannah, Port of Spain" : featurePhoto.alt} className="aspect-[4/3] w-full object-cover" /><figcaption className="text-caption mt-2 text-muted-foreground">{featurePhoto.caption} · {en ? "Photo" : "Photo"} : {featurePhoto.credit}, {featurePhoto.license}</figcaption></figure> : undefined}
      />

      <PublicSection>
        <nav aria-label={en ? "Feature categories" : "Catégories de fonctionnalités"} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2 sm:w-full sm:flex-wrap">
            {categories.map((category) => (
              <li key={category.id}>
                <a
                  href={`#${category.id}`}
                   className="text-body-sm touch-target inline-flex items-center border-b-2 border-transparent px-3 py-2 text-foreground transition-colors hover:border-brand hover:text-brand"
                >
                  {category.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

         <div className="mt-8 space-y-12 sm:mt-12 sm:space-y-16">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <section key={category.id} id={category.id} className="scroll-mt-24 border-t border-border pt-7 first:border-0 first:pt-0 sm:pt-9">
                <div className="flex items-start gap-3">
                  <Icon className="mt-1 size-6 shrink-0 text-brand" aria-hidden="true" />
                  <div className="min-w-0">
                    <SectionHeader as="h2" title={category.label} description={category.intro} />
                  </div>
                </div>
                 <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                   {category.items.map((item, index) => (
                    <article
                      key={item.title}
                       className="min-w-0 rounded-md border border-border bg-surface p-4 transition-colors hover:border-brand sm:p-5"
                    >
                       <span className="text-overline text-brand">{String(index + 1).padStart(2, "0")}</span>
                      <h3 className="text-heading-sm text-foreground">{item.title}</h3>
                      <p className="text-body-sm mt-2 text-muted-foreground">{item.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </PublicSection>

      <CtaSection />
    </PublicLayout>
  );
}
