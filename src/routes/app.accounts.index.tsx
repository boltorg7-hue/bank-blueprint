import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui";
import { EmptyState, ErrorState, LoadingState, PermissionDeniedState } from "@/components/feedback";
import { AccountListItem } from "@/features/accounts/components/AccountListItem";
import { useCustomerAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { isAllowed } from "@/features/customer-shell/lib/route-access";

export const Route = createFileRoute("/app/accounts/")({
  head: () => ({ meta: [
    { title: "Mes comptes — RFC Royal FINANCE Bank" },
    { name: "description", content: "Consultez vos comptes bancaires et leurs soldes." },
    { name: "robots", content: "noindex, nofollow" },
  ]}),
  component: AccountsListPage,
});

function AccountsListPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const { summary: customer } = useCustomerSummary();
  const query = useCustomerAccounts();
  const allowed = !customer || isAllowed(customer.lifecycleState, "banking-read");

  return (
    <BankingContentContainer width="wide">
      <PageHeader title={en ? "My accounts" : "Mes comptes"} description={en ? "Your bank accounts and balances." : "Vos comptes bancaires et leurs soldes."} />
      <PageSection>
        {!allowed ? (
          <PermissionDeniedState description={en ? "This section is not available with your current account status." : "Cette section n'est pas disponible avec le statut actuel de votre compte."} />
        ) : query.isError ? (
          <ErrorState title={en ? "Your accounts could not be loaded" : "Vos comptes n'ont pas pu être chargés"} onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <LoadingState label={en ? "Loading your accounts…" : "Chargement de vos comptes…"} />
        ) : (query.data ?? []).length === 0 ? (
          <EmptyState title={en ? "No bank accounts" : "Aucun compte bancaire"} description={en ? "Your bank account will open once your application has been fully approved." : "Votre compte bancaire sera ouvert dès la validation complète de votre dossier."} />
        ) : (
          <ul className="space-y-3">
            {(query.data ?? []).map((account) => <AccountListItem key={account.reference} account={account} />)}
          </ul>
        )}
      </PageSection>
    </BankingContentContainer>
  );
}
