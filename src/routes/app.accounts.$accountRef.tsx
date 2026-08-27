import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { AccountBalanceCard } from "@/features/accounts/components/AccountBalanceCard";
import { AccountCoordinatesPanel } from "@/features/accounts/components/AccountCoordinatesPanel";
import { RecentActivityList } from "@/features/accounts/components/RecentActivityList";
import { useAccountDetails } from "@/features/accounts/hooks/useAccounts";
import {
  accountRestrictionMessage,
  accountTypeLabel,
} from "@/features/accounts/utils/account-display";
import { formatDate } from "@/lib/format/date";

export const Route = createFileRoute("/app/accounts/$accountRef")({
  head: () => ({
    meta: [
      { title: "Détail du compte — RFC Royal FINANCE Bank" },
      { name: "description", content: "Solde, coordonnées bancaires et activité de votre compte." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountDetailsPage,
});

/**
 * Account details (§45 – §47, §91). A reference that does not belong to the
 * signed-in customer is indistinguishable from a non-existent account.
 */
function AccountDetailsPage() {
  const { accountRef } = Route.useParams();
  const query = useAccountDetails(accountRef);
  const account = query.data ?? null;
  const restriction = account ? accountRestrictionMessage(account.status) : null;

  return (
    <BankingContentContainer width="wide">
      <PageHeader
        title={account?.displayName ?? "Compte"}
        description={account ? accountTypeLabel(account.accountType) : undefined}
        backTo="/app/accounts"
      />

      {query.isError ? (
        <ErrorState
          title="Ce compte n'a pas pu être chargé"
          onRetry={() => query.refetch()}
        />
      ) : query.isPending ? (
        <LoadingState label="Chargement du compte…" />
      ) : !account ? (
        <EmptyState
          title="Compte introuvable"
          description="Ce compte n'existe pas ou n'est pas rattaché à votre profil."
        />
      ) : (
        <div className="space-y-8">
          <AccountBalanceCard
            account={account}
            isRefreshing={query.isFetching}
            isStale={query.isStale}
            onRetry={() => query.refetch()}
          />

          {restriction && (
            <p
              role="status"
              className="rounded-xl border border-warning/40 bg-warning-muted p-4 text-sm text-warning"
            >
              {restriction}
            </p>
          )}

          <AccountCoordinatesPanel
            coordinates={account.coordinates}
            holderName={account.holderName}
          />

          <section aria-labelledby="account-activity-heading" className="space-y-3">
            <h2 id="account-activity-heading" className="text-heading-sm text-foreground">
              Activité récente
            </h2>
            <RecentActivityList items={[]} />
          </section>

          <dl className="text-caption grid gap-2 text-muted-foreground">
            <div className="flex justify-between gap-3">
              <dt>Référence du compte</dt>
              <dd className="text-numeric text-foreground">{account.reference}</dd>
            </div>
            {account.openedAt && (
              <div className="flex justify-between gap-3">
                <dt>Ouvert le</dt>
                <dd className="text-foreground">{formatDate(account.openedAt)}</dd>
              </div>
            )}
            {account.closedAt && (
              <div className="flex justify-between gap-3">
                <dt>Clôturé le</dt>
                <dd className="text-foreground">{formatDate(account.closedAt)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </BankingContentContainer>
  );
}
