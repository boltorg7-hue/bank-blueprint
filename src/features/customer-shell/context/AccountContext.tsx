import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Account context foundation (§22 – §25).
 *
 * The shell never assumes a customer has exactly one account, and never
 * derives authorisation from the selected identifier: the account engine
 * (PROMPT 05) returns only accounts the authenticated customer owns, and the
 * server re-checks ownership on every read.
 */
export type CustomerAccountSummary = {
  /** Opaque server reference used in routes — never the full account number. */
  reference: string;
  label: string;
  /** Last digits only, for display. */
  maskedNumber: string;
  currency: string;
};

type AccountContextValue = {
  accounts: CustomerAccountSummary[];
  selectedAccount: CustomerAccountSummary | null;
  hasMultipleAccounts: boolean;
  /** True while the account service has not delivered anything yet. */
  isUnavailable: boolean;
  selectAccount: (reference: string) => void;
};

const SESSION_KEY = "rfc.selected-account";

const AccountContext = createContext<AccountContextValue>({
  accounts: [],
  selectedAccount: null,
  hasMultipleAccounts: false,
  isUnavailable: true,
  selectAccount: () => {},
});

export function AccountContextProvider({
  children,
  accounts = [],
}: {
  children: ReactNode;
  /** Supplied by the account service from PROMPT 05 onwards. */
  accounts?: CustomerAccountSummary[];
}) {
  const [selectedReference, setSelectedReference] = useState<string | null>(null);

  // Session-scoped preference only. No balance or financial payload is stored.
  useEffect(() => {
    try {
      setSelectedReference(window.sessionStorage.getItem(SESSION_KEY));
    } catch {
      /* storage unavailable — fall back to the first account */
    }
  }, []);

  const selectAccount = useCallback((reference: string) => {
    setSelectedReference(reference);
    try {
      window.sessionStorage.setItem(SESSION_KEY, reference);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<AccountContextValue>(() => {
    const selected =
      accounts.find((account) => account.reference === selectedReference) ??
      accounts[0] ??
      null;

    return {
      accounts,
      selectedAccount: selected,
      hasMultipleAccounts: accounts.length > 1,
      isUnavailable: accounts.length === 0,
      selectAccount,
    };
  }, [accounts, selectedReference, selectAccount]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccountContext(): AccountContextValue {
  return useContext(AccountContext);
}
