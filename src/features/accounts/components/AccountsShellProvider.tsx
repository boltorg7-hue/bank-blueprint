import type { ReactNode } from "react";

import { AccountContextProvider } from "@/features/customer-shell/context/AccountContext";
import { useCustomerAccounts } from "@/features/accounts/hooks/useAccounts";

/**
 * Feeds the shell account context with the real, server-owned account list
 * (§24, §25). Only reference, label, masked number and currency are exposed —
 * no balance is stored in the shell context.
 */
export function AccountsShellProvider({ children }: { children: ReactNode }) {
  const { data } = useCustomerAccounts();

  const accounts = (data ?? []).map((account) => ({
    reference: account.reference,
    label: account.displayName,
    maskedNumber: account.maskedNumber,
    currency: account.currency,
  }));

  return <AccountContextProvider accounts={accounts}>{children}</AccountContextProvider>;
}
