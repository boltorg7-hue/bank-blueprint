import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import { FaqItem } from "@/components/marketing/FaqItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback";
import { HELP_ARTICLES, HELP_CATEGORIES } from "@/features/public/content/help";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { HELP_ARTICLES_EN, HELP_CATEGORIES_EN } from "@/features/public/content/help-en";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Help center with client-side search over the configured help content
 * (§42-§43). No search backend — the content set is small and static.
 */
export function HelpCenter() {
  const { language } = useLanguage();
  const en = language === "en";
  const articles = en ? HELP_ARTICLES_EN : HELP_ARTICLES;
  const categories = en ? HELP_CATEGORIES_EN : HELP_CATEGORIES;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return articles.filter((article) => {
      const matchesCategory = !category || article.category === category;
      const matchesQuery =
        q.length === 0 ||
        normalize(article.question).includes(q) ||
        normalize(article.answer).includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category, articles]);

  const activeCategoryLabel = categories.find((item) => item.id === category)?.label;
  const hasFilters = query.length > 0 || category !== null;

  function clearFilters() {
    setQuery("");
    setCategory(null);
  }

  const resultLabel = en
    ? `${results.length} ${results.length === 1 ? "article" : "articles"}`
    : `${results.length} ${results.length === 1 ? "article" : "articles"}`;

  return (
    <div className="space-y-7">
      <section
        aria-label={en ? "Search help articles" : "Rechercher des articles d’aide"}
        className="rounded-2xl border border-border/80 bg-gradient-to-br from-surface-sunken/70 to-card p-4 shadow-sm sm:p-6"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Search className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-heading-sm text-foreground">
                {en ? "What do you need help with?" : "Que souhaitez-vous savoir ?"}
              </h2>
              <p className="text-caption mt-1 text-muted-foreground">
                {en ? "Search questions and answers" : "Recherchez dans les questions et réponses"}
              </p>
            </div>
          </div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="help-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={en ? "Transfers, statements, sign-in…" : "Virement, relevé, connexion…"}
              className="h-12 rounded-xl border-border/80 bg-card pl-11 shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-md"
              autoComplete="off"
            />
          </div>
        </div>
      </section>

      <section aria-label={en ? "Help categories" : "Catégories d’aide"} className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-label text-foreground">
            {en ? "Browse by topic" : "Parcourir par sujet"}
          </h2>
          <p className="text-caption text-muted-foreground" aria-live="polite">
            {resultLabel}
          </p>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div
            className="flex w-max gap-2 pb-1 sm:w-full sm:flex-wrap sm:pb-0"
            role="group"
            aria-label={en ? "Filter by category" : "Filtrer par catégorie"}
          >
            <Button
              variant={category === null ? "default" : "outline"}
              size="sm"
              className="touch-target rounded-full shadow-sm transition-all"
              aria-pressed={category === null}
              onClick={() => setCategory(null)}
            >
              {en ? "All topics" : "Tous les sujets"}
            </Button>
            {categories.map((item) => {
              const Icon = item.icon;
              const active = category === item.id;
              return (
                <Button
                  key={item.id}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className="touch-target rounded-full"
                  aria-pressed={active}
                  onClick={() => setCategory(active ? null : item.id)}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-sunken/40 p-5 sm:p-8">
          <EmptyState
            title={en ? "No matching articles" : "Aucun article ne correspond"}
            description={
              en
                ? "Try another search or clear the filters to browse all help topics."
                : "Essayez d’autres mots-clés ou effacez les filtres pour retrouver tous les sujets."
            }
          />
          {hasFilters && (
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="outline" onClick={clearFilters}>
                {en ? "Clear search and filters" : "Effacer la recherche et les filtres"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <section aria-label={en ? "Help search results" : "Résultats du centre d’aide"}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-heading-sm text-foreground">{en ? "Answers" : "Réponses"}</h2>
              {activeCategoryLabel && (
                <p className="text-caption mt-1 text-muted-foreground">{activeCategoryLabel}</p>
              )}
            </div>
            {hasFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                {en ? "Clear filters" : "Effacer les filtres"}
              </Button>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card px-4 shadow-sm sm:px-6">
            <Accordion type="single" collapsible className={cn("w-full")}>
              {results.map((article) => (
                <FaqItem
                  key={article.id}
                  value={article.id}
                  question={article.question}
                  answer={article.answer}
                />
              ))}
            </Accordion>
          </div>
        </section>
      )}
    </div>
  );
}
