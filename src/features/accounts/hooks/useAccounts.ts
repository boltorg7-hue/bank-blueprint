import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getAccountDetails,
  getCustomerAccounts,
  getDashboardSummary,
} from "@/features/accounts/services/accounts.functions";
import type {
  CustomerAccountDetailsDto,
  CustomerAccountSummaryDto,
  DashboardSummaryDto,
} from "@/features/accounts/types/account";

/**
 * Account read hooks (§92, §156).
 *
 * Balances are always fetched from the server and treated as a snapshot: a
 * short stale time plus refetch on focus, never an offline cache presented as
 * current (§8, §57).
 */

export const ACCOUNTS_KEY = ["accounts"] as const;
export const DASHBOARD_SUMMARY_KEY = ["dashboard-summary"] as const;

const BALANCE_QUERY_BEHAVIOUR = {
  staleTime: 10_000,
  gcTime: 60_000,
  refetchOnWindowFocus: true,
  retry: 1,
} as const;

export function useCustomerAccounts() {
  const fetchAccounts = useServerFn(getCustomerAccounts);
  return useQuery<CustomerAccountSummaryDto[]>({
    queryKey: ACCOUNTS_KEY,
    queryFn: () => fetchAccounts(),
    ...BALANCE_QUERY_BEHAVIOUR,
  });
}

export function useDashboardSummary() {
  const fetchSummary = useServerFn(getDashboardSummary);
  return useQuery<DashboardSummaryDto>({
    queryKey: DASHBOARD_SUMMARY_KEY,
    queryFn: () => fetchSummary(),
    ...BALANCE_QUERY_BEHAVIOUR,
  });
}

export function useAccountDetails(reference: string) {
  const fetchDetails = useServerFn(getAccountDetails);
  return useQuery<CustomerAccountDetailsDto | null>({
    queryKey: [...ACCOUNTS_KEY, "details", reference],
    queryFn: () => fetchDetails({ data: { reference } }),
    enabled: reference.length > 0,
    ...BALANCE_QUERY_BEHAVIOUR,
  });
}
