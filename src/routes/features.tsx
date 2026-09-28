import { createFileRoute } from "@tanstack/react-router";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { CtaSection } from "@/features/public/components/CtaSection";
import { publicMeta } from "@/features/public/lib/seo";
import { FEATURE_CATEGORIES } from "@/features/public/content/features";
import { PLACE_PHOTOS } from "@/features/public/content/home-heritage";

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
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Fonctionnalités"
        title="Votre banque, à portée de main"
        description="Vos comptes, vos virements et vos documents se retrouvent dans un seul espace. Chaque opération reste lisible, du début à la fin."
        aside={<figure><img src={PLACE_PHOTOS[0].src} alt={PLACE_PHOTOS[0].alt} className="aspect-[4/3] w-full object-cover" /><figcaption className="text-caption mt-2 text-muted-foreground">{PLACE_PHOTOS[0].caption} · Photo : {PLACE_PHOTOS[0].credit}, {PLACE_PHOTOS[0].license}</figcaption></figure>}
      />

      <PublicSection>
        <nav aria-label="Catégories de fonctionnalités" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2 sm:w-full sm:flex-wrap">
            {FEATURE_CATEGORIES.map((category) => (
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

         <div className="mt-12 space-y-16">
          {FEATURE_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <section key={category.id} id={category.id} className="scroll-mt-24">
                <div className="flex items-start gap-3">
                  <Icon className="mt-1 size-6 shrink-0 text-brand" aria-hidden="true" />
                  <div className="min-w-0">
                    <SectionHeader as="h2" title={category.label} description={category.intro} />
                  </div>
                </div>
                 <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                   {category.items.map((item, index) => (
                    <article
                      key={item.title}
                       className="border-t border-border py-5 transition-colors hover:border-brand"
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
