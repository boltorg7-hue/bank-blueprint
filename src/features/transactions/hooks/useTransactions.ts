import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getAccountActivityFeed,
  getTransactionDetail,
  listTransactions,
} from "@/features/transactions/services/transactions.functions";
import type {
  CustomerTransactionDto,
  TransactionDetailDto,
  TransactionPageDto,
  TransactionPageRequest,
} from "@/features/transactions/types/transaction";

/**
 * Transaction read hooks. Financial data is always a server snapshot: short
 * stale time, refetch on focus, never an offline cache shown as current (§149).
 */
export const TRANSACTIONS_KEY = ["transactions"] as const;

const QUERY_BEHAVIOUR = {
  staleTime: 10_000,
  gcTime: 60_000,
  refetchOnWindowFocus: true,
  retry: 1,
} as const;

export function useTransactionsPage(request: TransactionPageRequest) {
  const fetchPage = useServerFn(listTransactions);
  return useQuery<TransactionPageDto>({
    queryKey: [...TRANSACTIONS_KEY, "page", request],
    queryFn: () => fetchPage({ data: request }),
    ...QUERY_BEHAVIOUR,
  });
}

export function useAccountActivity(accountReference: string | null, limit = 5) {
  const fetchActivity = useServerFn(getAccountActivityFeed);
  return useQuery<CustomerTransactionDto[]>({
    queryKey: [...TRANSACTIONS_KEY, "activity", accountReference, limit],
    queryFn: () => fetchActivity({ data: { accountReference, limit } }),
    ...QUERY_BEHAVIOUR,
  });
}

export function useTransactionDetail(reference: string) {
  const fetchDetail = useServerFn(getTransactionDetail);
  return useQuery<TransactionDetailDto | null>({
    queryKey: [...TRANSACTIONS_KEY, "detail", reference],
    queryFn: () => fetchDetail({ data: { reference } }),
    enabled: reference.length > 0,
    ...QUERY_BEHAVIOUR,
  });
}
