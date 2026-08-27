import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import { FaqItem } from "@/components/marketing/FaqItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback";
import { HELP_ARTICLES, HELP_CATEGORIES } from "@/features/public/content/help";
import { cn } from "@/lib/utils";

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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return HELP_ARTICLES.filter((article) => {
      const matchesCategory = !category || article.category === category;
      const matchesQuery =
        q.length === 0 ||
        normalize(article.question).includes(q) ||
        normalize(article.answer).includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const activeCategoryLabel = HELP_CATEGORIES.find((c) => c.id === category)?.label;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <label htmlFor="help-search" className="text-label block text-foreground">
          Rechercher dans le centre d'aide
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="help-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Virement, relevé, connexion…"
            className="h-12 pl-9"
            autoComplete="off"
          />
        </div>
        <p className="text-caption text-muted-foreground" role="status">
          {results.length} article{results.length === 1 ? "" : "s"}
          {activeCategoryLabel ? ` · ${activeCategoryLabel}` : ""}
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 sm:w-full sm:flex-wrap">
          <Button
            variant={category === null ? "default" : "outline"}
            size="sm"
            className="touch-target"
            onClick={() => setCategory(null)}
          >
            Tous les sujets
          </Button>
          {HELP_CATEGORIES.map((item) => {
            const Icon = item.icon;
            const active = category === item.id;
            return (
              <Button
                key={item.id}
                variant={active ? "default" : "outline"}
                size="sm"
                className="touch-target"
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
        <EmptyState
          title="Aucun article ne correspond"
          description="Reformulez votre recherche ou contactez-nous depuis la page Contact."
        />
      ) : (
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
      )}
    </div>
  );
}
