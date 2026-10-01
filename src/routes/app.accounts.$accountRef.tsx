import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { AccountBalanceCard } from "@/features/accounts/components/AccountBalanceCard";
import { AccountCoordinatesPanel } from "@/features/accounts/components/AccountCoordinatesPanel";
import { RecentActivityList } from "@/features/accounts/components/RecentActivityList";
import { useAccountDetails } from "@/features/accounts/hooks/useAccounts";
import { useAccountActivity } from "@/features/transactions/hooks/useTransactions";
import type { CustomerTransactionDto } from "@/features/transactions/types/transaction";
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
  const { language } = useLanguage();
  const en = language === "en";
  const { accountRef } = Route.useParams();
  const query = useAccountDetails(accountRef);
  const account = query.data ?? null;
  const activityQuery = useAccountActivity(account?.reference ?? null, 5);
  const restriction = account ? accountRestrictionMessage(account.status) : null;

  return (
    <BankingContentContainer width="wide">
      <PageHeader
        title={account?.displayName ?? (en ? "Account" : "Compte")}
        description={account ? (en ? "Bank account" : accountTypeLabel(account.accountType)) : undefined}
        backTo="/app/accounts"
      />

      {query.isError ? (
        <ErrorState
          title={en ? "This account could not be loaded" : "Ce compte n'a pas pu être chargé"}
          onRetry={() => query.refetch()}
        />
      ) : query.isPending ? (
        <LoadingState label={en ? "Loading account…" : "Chargement du compte…"} />
      ) : !account ? (
        <EmptyState
          title={en ? "Account not found" : "Compte introuvable"}
          description={en ? "This account does not exist or is not linked to your profile." : "Ce compte n'existe pas ou n'est pas rattaché à votre profil."}
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
              {en ? "Recent activity" : "Activité récente"}
            </h2>
            {activityQuery.isError ? (
              <ErrorState
                title={en ? "Recent activity could not be loaded" : "L’activité récente n’a pas pu être chargée"}
                onRetry={() => activityQuery.refetch()}
              />
            ) : activityQuery.isPending ? (
              <LoadingState label={en ? "Loading recent activity…" : "Chargement de l’activité récente…"} />
            ) : (
              <RecentActivityList items={mapRecentActivity(activityQuery.data ?? [])} />
            )}
          </section>

          <dl className="text-caption grid gap-2 text-muted-foreground">
            <div className="flex justify-between gap-3">
              <dt>{en ? "Account reference" : "Référence du compte"}</dt>
              <dd className="text-numeric text-foreground">{account.reference}</dd>
            </div>
            {account.openedAt && (
              <div className="flex justify-between gap-3">
                <dt>{en ? "Opened" : "Ouvert le"}</dt>
                <dd className="text-foreground">{formatDate(account.openedAt)}</dd>
              </div>
            )}
            {account.closedAt && (
              <div className="flex justify-between gap-3">
                <dt>{en ? "Closed" : "Clôturé le"}</dt>
                <dd className="text-foreground">{formatDate(account.closedAt)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </BankingContentContainer>
  );
}


function mapRecentActivity(items: CustomerTransactionDto[]) {
  return items.map((item) => ({
    reference: item.reference,
    title: item.displayTitle,
    description: item.displayDescription,
    amountMinor: item.amountMinor,
    currency: item.currency,
    minorUnit: item.minorUnit,
    direction: item.direction,
    status: item.status,
    occurredAt: item.occurredAt,
    counterpartyDisplay: item.counterpartyDisplay,
  }));
}
