import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, FileText, Send, Wallet } from "lucide-react";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState, StateBlock } from "@/components/feedback";
import { AccountBalanceCard } from "@/features/accounts/components/AccountBalanceCard";
import { MonthlySummaryCard } from "@/features/accounts/components/MonthlySummaryCard";
import { RecentActivityList } from "@/features/accounts/components/RecentActivityList";
import { useDashboardSummary } from "@/features/accounts/hooks/useAccounts";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { isAllowed } from "@/features/customer-shell/lib/route-access";
import {
  accountAllowsTransactions,
  accountRestrictionMessage,
} from "@/features/accounts/utils/account-display";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Espace client" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

/**
 * Customer dashboard (§74 – §77): balance first, one compact monthly summary,
 * a short activity preview and the primary actions. Nothing else.
 */
function DashboardPage() {
  const { summary: customer } = useCustomerSummary();
  const query = useDashboardSummary();
  const data = query.data;

  const account = data?.accounts.find((item) => item.isPrimary) ?? data?.accounts[0] ?? null;
  const canTransact =
    !!account &&
    accountAllowsTransactions(account.status) &&
    !!customer &&
    isAllowed(customer.lifecycleState, "banking-transact");
  const restriction = account ? accountRestrictionMessage(account.status) : null;

  return (
    <BankingContentContainer width="wide">
      <PageHeader
        title={customer ? `Bonjour ${customer.displayName.split(" ")[0]}` : "Bonjour"}
        description="Voici la situation de votre compte."
      />

      {query.isError ? (
        <ErrorState
          title="Vos informations bancaires n'ont pas pu être chargées"
          description="Aucun solde approximatif n'est affiché. Réessayez dans un instant."
          onRetry={() => query.refetch()}
        />
      ) : query.isPending ? (
        <LoadingState label="Chargement de votre compte…" />
      ) : data?.provisioningPending ? (
        <StateBlock
          icon={Clock}
          tone="info"
          title="Votre compte est en cours d'ouverture"
          description="L'ouverture de votre compte bancaire est en cours de finalisation. Vos soldes apparaîtront ici dès qu'elle sera terminée."
        />
      ) : !account ? (
        <EmptyState
          title="Aucun compte bancaire pour le moment"
          description="Votre compte bancaire sera ouvert dès la validation complète de votre dossier."
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

          <section aria-labelledby="quick-actions-heading" className="space-y-3">
            <h2 id="quick-actions-heading" className="text-heading-sm text-foreground">
              Actions rapides
            </h2>
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <QuickAction
                to="/app/transfers"
                label="Envoyer de l'argent"
                icon={Send}
                disabled={!canTransact}
              />
              <QuickAction to="/app/accounts" label="Mes comptes" icon={Wallet} />
              <QuickAction to="/app/statements" label="Relevés" icon={FileText} />
              <QuickAction
                to="/app/accounts/$accountRef"
                params={{ accountRef: account.reference }}
                label="Recevoir un paiement"
                icon={ArrowDownToLine}
              />
            </ul>
          </section>

          {data?.monthlySummary && <MonthlySummaryCard summary={data.monthlySummary} />}

          <section aria-labelledby="activity-heading" className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="activity-heading" className="text-heading-sm text-foreground">
                Activité récente
              </h2>
              <Link to="/app/transactions" className="text-caption text-primary hover:underline">
                Tout l'historique
              </Link>
            </div>
            <RecentActivityList items={data?.recentActivity ?? []} />
          </section>
        </div>
      )}
    </BankingContentContainer>
  );
}

function QuickAction({
  to,
  params,
  label,
  icon: Icon,
  disabled = false,
}: {
  to: "/app/transfers" | "/app/accounts" | "/app/statements" | "/app/accounts/$accountRef";
  params?: { accountRef: string };
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}) {
  const content = (
    <>
      <Icon className="size-5" aria-hidden="true" />
      <span className="mt-3 block leading-snug">{label}</span>
      {disabled && <span className="text-caption mt-1 block">Indisponible</span>}
    </>
  );

  const className =
    "flex h-full min-h-24 flex-col justify-between rounded-xl border border-border bg-surface p-4 text-sm";

  return (
    <li>
      {disabled ? (
        <span aria-disabled="true" className={`${className} text-muted-foreground`}>
          {content}
        </span>
      ) : (
        <Link
          to={to}
          {...(params ? { params } : {})}
          className={`${className} press-feedback text-foreground transition-colors hover:border-border-strong`}
        >
          {content}
        </Link>
      )}
    </li>
  );
}
