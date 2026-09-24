import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { createSupportThread, getAdminSupport, getCustomerSupport, replySupportThread, setSupportStatus, staffReplySupportThread } from "@/features/support/services/support.functions";
import type { SupportCategory, SupportStatus } from "@/features/support/types/support";

const CUSTOMER_SUPPORT_KEY = ["support", "customer"] as const;
const ADMIN_SUPPORT_KEY = ["support", "admin"] as const;
export function useCustomerSupport() { const fn = useServerFn(getCustomerSupport); return useQuery({ queryKey: CUSTOMER_SUPPORT_KEY, queryFn: () => fn(), staleTime: 5_000 }); }
export function useAdminSupport() { const fn = useServerFn(getAdminSupport); return useQuery({ queryKey: ADMIN_SUPPORT_KEY, queryFn: () => fn(), staleTime: 5_000 }); }
function useInvalidatingMutation<T>(fn: (data: T) => Promise<unknown>, key: readonly string[]) { const qc = useQueryClient(); return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: key }) }); }
export function useCreateSupportThread() { const fn = useServerFn(createSupportThread); return useInvalidatingMutation((data: { subject: string; category: SupportCategory; body: string }) => fn({ data }), CUSTOMER_SUPPORT_KEY); }
export function useReplySupportThread() { const fn = useServerFn(replySupportThread); return useInvalidatingMutation((data: { threadId: string; body: string }) => fn({ data }), CUSTOMER_SUPPORT_KEY); }
export function useStaffReplySupportThread() { const fn = useServerFn(staffReplySupportThread); return useInvalidatingMutation((data: { threadId: string; body: string }) => fn({ data }), ADMIN_SUPPORT_KEY); }
export function useSetSupportStatus() { const fn = useServerFn(setSupportStatus); return useInvalidatingMutation((data: { threadId: string; status: SupportStatus }) => fn({ data }), ADMIN_SUPPORT_KEY); }
