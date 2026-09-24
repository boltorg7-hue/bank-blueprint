import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  createFundingRequest,
  decideFundingRequest,
  getAdminDashboard,
  getAdminStaffContext,
  listAdminAccounts,
  listAdminCustomers,
  listFundingRequests,
  setAccountStatus,
  setCustomerState,
  listAdminExternalTransfers,
  advanceAdminExternalTransfer,
} from "@/features/admin/services/admin.functions";

export const ADMIN_CONTEXT_KEY = ["admin", "context"] as const;
export const ADMIN_DASHBOARD_KEY = ["admin", "dashboard"] as const;
export const ADMIN_ACCOUNTS_KEY = ["admin", "accounts"] as const;
export const ADMIN_FUNDING_KEY = ["admin", "funding"] as const;

export function useAdminContext() {
  const fn = useServerFn(getAdminStaffContext);
  return useQuery({ queryKey: ADMIN_CONTEXT_KEY, queryFn: () => fn(), staleTime: 30_000, retry: false });
}

export function useAdminDashboard() {
  const fn = useServerFn(getAdminDashboard);
  return useQuery({ queryKey: ADMIN_DASHBOARD_KEY, queryFn: () => fn(), staleTime: 10_000, retry: 1 });
}

export function useAdminCustomers(search: string) {
  const fn = useServerFn(listAdminCustomers);
  return useQuery({ queryKey: ["admin", "customers", search], queryFn: () => fn({ data: { search } }), staleTime: 10_000 });
}

export function useAdminAccounts(search = "") {
  const fn = useServerFn(listAdminAccounts);
  return useQuery({ queryKey: [...ADMIN_ACCOUNTS_KEY, search], queryFn: () => fn({ data: { search } }), staleTime: 10_000 });
}

export function useFundingRequests() {
  const fn = useServerFn(listFundingRequests);
  return useQuery({ queryKey: ADMIN_FUNDING_KEY, queryFn: () => fn(), staleTime: 5_000 });
}

export function useCreateFundingRequest() {
  const fn = useServerFn(createFundingRequest);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { accountReference: string; amountMinor: number; reason: string; idempotencyKey: string }) => fn({ data: input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_FUNDING_KEY }),
        queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_KEY }),
      ]);
    },
  });
}

export function useDecideFundingRequest() {
  const fn = useServerFn(decideFundingRequest);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestId: string; approve: boolean }) => fn({ data: input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_FUNDING_KEY }),
        queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_KEY }),
        queryClient.invalidateQueries({ queryKey: ADMIN_ACCOUNTS_KEY }),
      ]);
    },
  });
}

export function useSetCustomerState() {
  const fn = useServerFn(setCustomerState); const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: { customerId: string; state: "ACTIVE" | "RESTRICTED" | "SUSPENDED"; reason: string }) => fn({ data: input }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "customers"] }) });
}

export function useSetAccountStatus() {
  const fn = useServerFn(setAccountStatus); const queryClient = useQueryClient();
  return useMutation({ mutationFn: (input: { accountReference: string; status: "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "FROZEN"; reason: string }) => fn({ data: input }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_ACCOUNTS_KEY }) });
}
export const ADMIN_EXTERNAL_TRANSFERS_KEY=["admin","external-transfers"] as const;
export function useAdminExternalTransfers(){const fn=useServerFn(listAdminExternalTransfers);return useQuery({queryKey:ADMIN_EXTERNAL_TRANSFERS_KEY,queryFn:()=>fn(),staleTime:5_000});}
export function useAdvanceExternalTransfer(){const fn=useServerFn(advanceAdminExternalTransfer);const qc=useQueryClient();return useMutation({mutationFn:(data:{reference:string;action:"APPROVE"|"QUEUE"|"FINALIZE"})=>fn({data}),onSuccess:()=>qc.invalidateQueries({queryKey:ADMIN_EXTERNAL_TRANSFERS_KEY})});}
