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

  const activeCategoryLabel = categories.find((c) => c.id === category)?.label;

  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-border bg-surface-sunken/60 p-4 sm:p-5">
        <div className="space-y-3">
          <label htmlFor="help-search" className="text-label block text-foreground">
            {en ? "Search the help center" : "Rechercher dans le centre d’aide"}
          </label>
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
              className="h-12 rounded-xl border-border bg-card pl-11 shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-caption text-muted-foreground" role="status">
              {results.length} {en ? "article" : "article"}
              {results.length === 1 ? "" : "s"}
              {activeCategoryLabel ? ` · ${activeCategoryLabel}` : ""}
            </p>
            {(query || category) && (
              <button
                type="button"
                className="text-caption rounded-md px-2 py-1 font-medium text-brand transition-colors hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  setQuery("");
                  setCategory(null);
                }}
              >
                {en ? "Clear filters" : "Effacer les filtres"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 sm:w-full sm:flex-wrap">
          <Button
            variant={category === null ? "default" : "outline"}
            size="sm"
            className="touch-target rounded-full"
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

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-sunken/40 p-5 sm:p-8">
          <EmptyState
            title={en ? "No matching articles" : "Aucun article ne correspond"}
            description={
              en
                ? "Try another search or reach us through the Contact page."
                : "Reformulez votre recherche ou contactez-nous depuis la page Contact."
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card px-4 shadow-sm sm:px-6">
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
      )}
    </div>
  );
}
