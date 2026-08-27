import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PermissionDeniedState,
} from "@/components/feedback";
import { AccountListItem } from "@/features/accounts/components/AccountListItem";
import { useCustomerAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { isAllowed } from "@/features/customer-shell/lib/route-access";

export const Route = createFileRoute("/app/accounts/")({
  head: () => ({
    meta: [
      { title: "Mes comptes — RFC Royal FINANCE Bank" },
      { name: "description", content: "Consultez vos comptes bancaires et leurs soldes." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountsListPage,
});

/** Account list (§40 – §47): multi-account by default, one row per account. */
function AccountsListPage() {
  const { summary: customer } = useCustomerSummary();
  const query = useCustomerAccounts();
  const allowed = !customer || isAllowed(customer.lifecycleState, "banking-read");

  return (
    <BankingContentContainer width="wide">
      <PageHeader title="Mes comptes" description="Vos comptes bancaires et leurs soldes." />

      {!allowed ? (
        <PermissionDeniedState description="Cette section n'est pas disponible avec le statut actuel de votre compte." />
      ) : query.isError ? (
        <ErrorState
          title="Vos comptes n'ont pas pu être chargés"
          onRetry={() => query.refetch()}
        />
      ) : query.isPending ? (
        <LoadingState label="Chargement de vos comptes…" />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          title="Aucun compte bancaire"
          description="Votre compte bancaire sera ouvert dès la validation complète de votre dossier."
        />
      ) : (
        <ul className="space-y-3">
          {(query.data ?? []).map((account) => (
            <AccountListItem key={account.reference} account={account} />
          ))}
        </ul>
      )}
    </BankingContentContainer>
  );
}
