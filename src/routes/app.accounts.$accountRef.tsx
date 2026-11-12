import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui/page-section";
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
      {
        name: "description",
        content: "Solde, coordonnées bancaires et activité de votre compte.",
      },
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
  const restriction = account
    ? accountRestrictionMessage(account.status, en ? "en" : "fr")
    : null;

  return (
    <BankingContentContainer width="wide">
      <PageHeader
        title={account?.displayName ?? (en ? "Account" : "Compte")}
        description={
          account
            ? en
              ? account.accountType === "CURRENT"
                ? "Current account"
                : "Savings account"
              : accountTypeLabel(account.accountType)
            : undefined
        }
        backTo="/app/accounts"
      />

      <PageSection>
        {query.isError ? (
          <ErrorState
            title={
              en
                ? "Your account information is being refreshed"
                : "Actualisation de vos informations de compte en cours"
            }
            onRetry={() => query.refetch()}
          />
        ) : query.isPending ? (
          <LoadingState label={en ? "Loading account…" : "Chargement du compte…"} />
        ) : !account ? (
          <EmptyState
            title={
              en
                ? "This account is not linked to your banking space"
                : "Ce compte n'est pas rattaché à votre espace bancaire"
            }
            description={
              en
                ? "Check the account reference or return to your account list."
                : "Vérifiez la référence du compte ou revenez à la liste de vos comptes."
            }
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
                  title={
                    en
                      ? "Your recent activity is being refreshed"
                      : "Actualisation de votre activité récente en cours"
                  }
                  onRetry={() => activityQuery.refetch()}
                />
              ) : activityQuery.isPending ? (
                <LoadingState
                  label={en ? "Loading recent activity…" : "Chargement de l’activité récente…"} 
                />
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
      </PageSection>
    </BankingContentContainer>
  );
}

function mapRecentActivity(items: CustomerTransactionDto[]) {
  return items
    .filter((item) => item.direction !== "NEUTRAL")
    .map((item) => ({
      reference: item.reference,
      type: item.type,
      direction: (item.direction === "INCOMING" ? "credit" : "debit") as "credit" | "debit",
      displayName: item.displayTitle,
      amountMinor: item.amountMinor,
      currency: item.currency,
      minorUnit: item.minorUnit,
      occurredAt: item.occurredAt,
      status: (item.status === "COMPLETED"
        ? "POSTED"
        : item.status === "FAILED" || item.status === "CANCELLED"
          ? "FAILED"
          : "PENDING") as "POSTED" | "FAILED" | "PENDING",
    }));
}
