import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState, SkeletonBlock } from "@/components/feedback";
import { useTransactionsPage } from "@/features/transactions/hooks/useTransactions";
import type { TransactionFilterState as Filters } from "@/features/transactions/types/transaction";
import {
  EMPTY_FILTERS,
  TransactionFilters,
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
  const [page, setPage] = useState(1);

  const request = { ...filters, accountReference, page, pageSize };
  const { data, isPending, isFetching, isError, refetch } = useTransactionsPage(request);

  const updateFilters = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  if (isError) {
    return (
      <ErrorState
        title="Historique momentanément indisponible"
        description="Nous n'avons pas pu charger vos opérations. Vos données ne sont pas affectées."
        onRetry={() => void refetch()}
      />
    );
  }

  const items = data?.items ?? [];
  const totalPages = data ? Math.max(Math.ceil(data.totalCount / data.pageSize), 1) : 1;

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
              emptyTitle="Aucune opération à afficher"
              emptyDescription="Aucune opération ne correspond à votre recherche pour le moment."
            />
          </div>
          <div className="hidden lg:block">
            {items.length === 0 ? (
              <TransactionList
                items={items}
                emptyTitle="Aucune opération à afficher"
                emptyDescription="Aucune opération ne correspond à votre recherche pour le moment."
              />
            ) : (
              <TransactionTable items={items} />
            )}
          </div>

          {data && data.totalCount > data.pageSize ? (
            <nav
              aria-label="Pagination de l'historique"
              className="flex items-center justify-between gap-3"
            >
              <Button
                variant="outline"
                className="touch-target"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                Précédent
              </Button>
              <p aria-live="polite" className="text-caption text-muted-foreground">
                Page {data.page} sur {totalPages}
              </p>
              <Button
                variant="outline"
                className="touch-target"
                disabled={!data.hasMore || isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Suivant
              </Button>
            </nav>
          ) : null}

          {isFetching && !isPending ? <LoadingState label="Actualisation…" /> : null}
        </>
      )}
    </div>
  );
}
