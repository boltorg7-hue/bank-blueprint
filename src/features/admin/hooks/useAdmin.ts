import { QUERY_POLICY } from "@/lib/query-policy";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  createFundingRequest,
  decideFundingRequest,
  getAdminDashboard,
  getAdminStaffContext,
  listAdminAccounts,
  listAdminCustomers,
  listAdminOnboardingCases,
  listFundingRequests,
  setAccountStatus,
  setCustomerState,
  listAdminExternalTransfers,
  advanceAdminExternalTransfer,
  activateAdminOnboardingCustomer,
  decideAdminOnboardingCase,
  inviteAdminCustomer,
  reviewAdminOnboardingCase,
  listAdminAuditEvents,
  listAdminAccountStatusHistory,
  getAdminCustomerDossier,
} from "@/features/admin/services/admin.functions";

export const ADMIN_CONTEXT_KEY = ["admin", "context"] as const;
export const ADMIN_DASHBOARD_KEY = ["admin", "dashboard"] as const;
export const ADMIN_ACCOUNTS_KEY = ["admin", "accounts"] as const;
export const ADMIN_FUNDING_KEY = ["admin", "funding"] as const;
export const ADMIN_ONBOARDING_KEY = ["admin", "onboarding-cases"] as const;
export const ADMIN_CUSTOMERS_KEY = ["admin", "customers"] as const;
export const ADMIN_DOSSIER_KEY = ["admin", "customer-dossier"] as const;

export function useAdminContext() {
  const fn = useServerFn(getAdminStaffContext);
  return useQuery({ queryKey: ADMIN_CONTEXT_KEY, queryFn: () => fn(), ...QUERY_POLICY.NORMAL, retry: false });
}

export function useAdminDashboard() {
  const fn = useServerFn(getAdminDashboard);
  const { data: staff } = useAdminContext();
  return useQuery({ queryKey: ADMIN_DASHBOARD_KEY, queryFn: () => fn(), ...QUERY_POLICY.NORMAL, retry: 1, enabled: staff?.authorized === true && staff.permissions.includes("admin.access") });
}

export function useAdminCustomers(search: string, cursor: string | null = null, lifecycle = "ALL", accounts = "ALL", attention = "ALL") {
  const fn = useServerFn(listAdminCustomers);
  const { data: staff } = useAdminContext();
  return useQuery({ queryKey: [...ADMIN_CUSTOMERS_KEY, search, cursor, lifecycle, accounts, attention], queryFn: () => fn({ data: { search, cursor, lifecycle, accounts, attention } }), ...QUERY_POLICY.NORMAL, enabled: staff?.authorized === true && staff.permissions.includes("customers.read") });
}

export function useAdminOnboardingCases(search: string) {
  const fn = useServerFn(listAdminOnboardingCases);
  const { data: staff } = useAdminContext();
  return useQuery({
    queryKey: [...ADMIN_ONBOARDING_KEY, search],
    queryFn: () => fn({ data: { search } }),
    ...QUERY_POLICY.NORMAL,
    enabled: staff?.authorized === true && staff.permissions.includes("customers.read"),
  });
}

function onboardingMutation<T, R>(fn: (input: T) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_ONBOARDING_KEY }) });
}

export function useInviteAdminCustomer() {
  const fn = useServerFn(inviteAdminCustomer);
  return onboardingMutation((data: { email: string; firstName: string; lastName: string }) => fn({ data }));
}

export function useReviewAdminOnboardingCase() {
  const fn = useServerFn(reviewAdminOnboardingCase);
  return onboardingMutation((data: { customerId: string; recommendation: "APPROVE" | "REJECT" | "REQUEST_INFO"; note: string }) => fn({ data }));
}

export function useDecideAdminOnboardingCase() {
  const fn = useServerFn(decideAdminOnboardingCase);
  return onboardingMutation((data: { requestId: string; confirm: boolean; note: string }) => fn({ data }));
}

export function useActivateAdminOnboardingCustomer() {
  const fn = useServerFn(activateAdminOnboardingCustomer);
  return onboardingMutation((data: { customerId: string; reason: string }) => fn({ data }));
}

export function useAdminAccounts(search = "", cursor: string | null = null) {
  const fn = useServerFn(listAdminAccounts);
  const { data: staff } = useAdminContext();
  return useQuery({ queryKey: [...ADMIN_ACCOUNTS_KEY, search, cursor], queryFn: () => fn({ data: { search } }), ...QUERY_POLICY.NORMAL, enabled: staff?.authorized === true && staff.permissions.includes("accounts.read") });
}

export function useFundingRequests() {
  const fn = useServerFn(listFundingRequests);
  const { data: staff } = useAdminContext();
  return useQuery({ queryKey: ADMIN_FUNDING_KEY, queryFn: () => fn(), ...QUERY_POLICY.REALTIME, enabled: staff?.authorized === true && (staff.permissions.includes("finance.adjustment.create") || staff.permissions.includes("finance.adjustment.approve")) });
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
  const fn = useServerFn(setCustomerState);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { customerId: string; state: "ACTIVE" | "RESTRICTED" | "SUSPENDED"; reason: string }) => fn({ data: input }),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_CUSTOMERS_KEY }),
        queryClient.invalidateQueries({ queryKey: [...ADMIN_DOSSIER_KEY, variables.customerId] }),
        queryClient.invalidateQueries({ queryKey: ADMIN_ACCOUNTS_KEY }),
        queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_KEY }),
        queryClient.invalidateQueries({ queryKey: ADMIN_AUDIT_KEY }),
      ]);
    },
  });
}

export function useSetAccountStatus() {
  const fn = useServerFn(setAccountStatus);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { accountReference: string; customerId?: string; status: "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "FROZEN"; reason: string }) => fn({ data: input }),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ADMIN_ACCOUNTS_KEY }),
        variables.customerId ? queryClient.invalidateQueries({ queryKey: [...ADMIN_DOSSIER_KEY, variables.customerId] }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_KEY }),
        queryClient.invalidateQueries({ queryKey: ADMIN_AUDIT_KEY }),
      ]);
    },
  });
}

export const ADMIN_EXTERNAL_TRANSFERS_KEY = ["admin", "external-transfers"] as const;

export function useAdminExternalTransfers() {
  const fn = useServerFn(listAdminExternalTransfers);
  const { data: staff } = useAdminContext();

  return useQuery({
    queryKey: ADMIN_EXTERNAL_TRANSFERS_KEY,
    queryFn: () => fn(),
    ...QUERY_POLICY.REALTIME,
    enabled:
      staff?.authorized === true &&
      (staff.permissions.includes("compliance.review") || staff.permissions.includes("transfers.approve")),
  });
}

export function useAdvanceExternalTransfer() {
  const fn = useServerFn(advanceAdminExternalTransfer);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { reference: string; action: "APPROVE" | "QUEUE" | "FINALIZE" }) => fn({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_EXTERNAL_TRANSFERS_KEY }),
  });
}

export const ADMIN_AUDIT_KEY = ["admin", "audit"] as const;

export function useAdminAudit(search = "") {
  const fn = useServerFn(listAdminAuditEvents);
  const { data: staff } = useAdminContext();
  return useQuery({
    queryKey: [...ADMIN_AUDIT_KEY, search],
    queryFn: () => fn({ data: { search } }),
    ...QUERY_POLICY.REALTIME,
    enabled: staff?.authorized === true && staff.permissions.includes("audit.read"),
  });
}

export function useAdminAccountStatusHistory(accountReference: string | null) {
  const fn = useServerFn(listAdminAccountStatusHistory);
  const { data: staff } = useAdminContext();
  return useQuery({
    queryKey: ["admin", "account-status-history", accountReference],
    queryFn: () => fn({ data: { accountReference: accountReference! } }),
    ...QUERY_POLICY.REALTIME,
    enabled: Boolean(accountReference) && staff?.authorized === true && staff.permissions.includes("accounts.read"),
  });
}

export function useAdminCustomerDossier(customerId: string | null) {
  const fn = useServerFn(getAdminCustomerDossier);
  const { data: staff } = useAdminContext();
  return useQuery({
    queryKey: [...ADMIN_DOSSIER_KEY, customerId],
    queryFn: () => fn({ data: { customerId: customerId! } }),
    ...QUERY_POLICY.REALTIME,
    enabled: Boolean(customerId) && staff?.authorized === true && staff.permissions.includes("customers.read"),
  });
}
