import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getCustomerContext } from "@/features/onboarding/services/onboarding.functions";
import type { CustomerContext } from "@/features/onboarding/types/customer-context";

export const CUSTOMER_CONTEXT_KEY = ["customer-context"] as const;

/** Single source of truth for the signed-in customer's trusted state. */
export function useCustomerContext() {
  const fetchContext = useServerFn(getCustomerContext);
  return useQuery<CustomerContext>({
    queryKey: CUSTOMER_CONTEXT_KEY,
    queryFn: () => fetchContext(),
    staleTime: 15_000,
  });
}

export function useInvalidateCustomerContext() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CUSTOMER_CONTEXT_KEY });
}
