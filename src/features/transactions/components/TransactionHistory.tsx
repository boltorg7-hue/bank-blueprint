import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, SkeletonBlock } from "@/components/feedback";
import { useTransactionsPage } from "@/features/transactions/hooks/useTransactions";
import type { TransactionFilterState as Filters } from "@/features/transactions/types/transaction";
import {
  EMPTY_FILTERS,
  TransactionFilters,
  amountToMinor,
} from "@/features/transactions/components/TransactionFilters";
import { TransactionList } from "@/features/transactions/components/TransactionList";
import { TransactionTable } from "@/features/transactions/components/TransactionTable";

/**
 * Full transaction history (§86 – §94). Server-side pagination and filtering:
 * the client never sorts or filters a local copy of financial data.
 */
export function TransactionHistory({
  accountReference = null,
  pageSize = 25,
  showFilters = true,
}: {
  accountReference?: string | null;
  pageSize?: number;
  showFilters?: boolean;
}) {
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const { language } = useLanguage();
  const en = language === "en";
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);

  const request = {
    direction: filters.direction, status: filters.status, datePreset: filters.datePreset,
    type: filters.type, search: filters.search, from: filters.from, to: filters.to,
    minAmountMinor: amountToMinor(filters.minAmount), maxAmountMinor: amountToMinor(filters.maxAmount),
    accountReference, cursor, pageSize,
  };
  const { data, isPending, isFetching, isError, refetch } = useTransactionsPage(request);

  const updateFilters = (next: Filters) => {
    setFilters(next);
    setCursor(null);
    setCursorHistory([]);
  };

  if (isError) {
    return (
      <ErrorState
        title={en ? "History temporarily unavailable" : "Historique momentanément indisponible"}
        description={en ? "We couldn't load your transactions. Your data is unaffected." : "Nous n'avons pas pu charger vos opérations. Vos données ne sont pas affectées."}
        onRetry={() => void refetch()}
      />
    );
  }

  const items = data?.items ?? [];

  const goNext = () => {
    if (!data?.nextCursor) return;
    setCursorHistory((history) => [...history, cursor ?? ""]);
    setCursor(data.nextCursor);
  };

  const goPrevious = () => {
    setCursorHistory((history) => {
      const next = [...history];
      setCursor(next.pop() || null);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {showFilters ? <TransactionFilters filters={filters} onChange={updateFilters} /> : null}

      {isPending ? (
        <SkeletonBlock lines={6} />
      ) : (
        <>
          <div className="lg:hidden">
            <TransactionList
              items={items}
              emptyTitle={en ? "No transactions to show" : "Aucune opération à afficher"}
              emptyDescription={en ? "No transactions match your filters." : "Aucune opération ne correspond à votre recherche pour le moment."}
            />
          </div>
          <div className="hidden lg:block">
            {items.length === 0 ? (
              <TransactionList
                items={items}
                emptyTitle={en ? "No transactions to show" : "Aucune opération à afficher"}
                emptyDescription={en ? "No transactions match your filters." : "Aucune opération ne correspond à votre recherche pour le moment."}
              />
            ) : (
              <TransactionTable items={items} />
            )}
          </div>

          {data && (cursorHistory.length > 0 || data.hasMore) ? (
            <nav
              aria-label={en ? "History pages" : "Pagination de l'historique"}
              className="flex items-center justify-between gap-3"
            >
              <Button
                variant="outline"
                className="touch-target"
                disabled={!cursorHistory.length || isFetching}
                onClick={goPrevious}
              >
                {en ? "Previous" : "Précédent"}
              </Button>
              <p aria-live="polite" className="text-caption text-muted-foreground">
                {en ? "Showing the latest transactions" : "Affichage des opérations les plus récentes"}
              </p>
              <Button
                variant="outline"
                className="touch-target"
                disabled={!data.hasMore || isFetching}
                onClick={goNext}
              >
                {en ? "Next" : "Suivant"}
              </Button>
            </nav>
          ) : null}

          {isFetching && !isPending ? <LoadingState label={en ? "Updating…" : "Actualisation…"} /> : null}
        </>
      )}
    </div>
  );
}
