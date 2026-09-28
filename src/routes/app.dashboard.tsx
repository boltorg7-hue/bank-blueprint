import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, FileText, Send, Wallet } from "lucide-react";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, LoadingState, StateBlock } from "@/components/feedback";
import { AccountBalanceCard } from "@/features/accounts/components/AccountBalanceCard";
import { MonthlySummaryCard } from "@/features/accounts/components/MonthlySummaryCard";
import { RecentActivityList } from "@/features/accounts/components/RecentActivityList";
import { useDashboardSummary } from "@/features/accounts/hooks/useAccounts";
import { ActionRequiredTransfers } from "@/features/transfers/components/ActionRequiredTransfers";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { isAllowed } from "@/features/customer-shell/lib/route-access";
import {
  accountAllowsTransactions,
  accountRestrictionMessage,
} from "@/features/accounts/utils/account-display";
import { Clock } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();
  const en = language === "en";
  const { summary: customer } = useCustomerSummary();
  const query = useDashboardSummary();
  const data = query.data;

  const account = data?.accounts.find((item) => item.isPrimary) ?? data?.accounts[0] ?? null;
  const canTransact =
    !!account &&
    accountAllowsTransactions(account.status) &&
    !!customer &&
    isAllowed(customer.lifecycleState, "transactional");
  const restriction = account ? accountRestrictionMessage(account.status) : null;

  return (
    <BankingContentContainer width="wide">
      <PageHeader
        title={customer ? `${en ? "Hello" : "Bonjour"} ${customer.displayName.split(" ")[0]}` : en ? "Hello" : "Bonjour"}
         description={en ? "Your account, transactions and next steps in one place." : "Votre compte, vos opérations et vos prochaines actions au même endroit."}
      />
      <p className="-mt-4 mb-2 text-caption">
        <Link to="/" className="text-primary hover:underline">
          {en ? "Visit the bank's public site" : "Voir le site public de la banque"}
        </Link>
      </p>

      {query.isError ? (
        <ErrorState
          title={en ? "Your account information could not be loaded" : "Vos informations bancaires n'ont pas pu être chargées"}
          description={en ? "No estimated balance is shown. Please try again shortly." : "Aucun solde approximatif n'est affiché. Réessayez dans un instant."}
          onRetry={() => query.refetch()}
        />
      ) : query.isPending ? (
        <LoadingState label={en ? "Loading your account…" : "Chargement de votre compte…"} />
      ) : data?.provisioningPending ? (
        <StateBlock
          icon={Clock}
          tone="info"
          title={en ? "Your account is being opened" : "Votre compte est en cours d'ouverture"}
          description={en ? "Your bank account is being finalised. Your balances will appear here once it is ready." : "L'ouverture de votre compte bancaire est en cours de finalisation. Vos soldes apparaîtront ici dès qu'elle sera terminée."}
        />
      ) : !account ? (
        <EmptyState
          title={en ? "No bank account yet" : "Aucun compte bancaire pour le moment"}
          description={en ? "Your bank account will open when your application is fully approved." : "Votre compte bancaire sera ouvert dès la validation complète de votre dossier."}
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

          <ActionRequiredTransfers />

           <section aria-labelledby="quick-actions-heading" className="space-y-4">
            <h2 id="quick-actions-heading" className="text-heading-sm text-foreground">
              {en ? "Quick actions" : "Actions rapides"}
            </h2>
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <QuickAction
                to="/app/transfers"
                label={en ? "Send money" : "Envoyer de l'argent"}
                icon={Send}
                disabled={!canTransact}
              />
              <QuickAction to="/app/accounts" label={en ? "My accounts" : "Mes comptes"} icon={Wallet} />
              <QuickAction to="/app/statements" label={en ? "Statements" : "Relevés"} icon={FileText} />
              <QuickAction
                to="/app/accounts/$accountRef"
                params={{ accountRef: account.reference }}
                label={en ? "Receive a payment" : "Recevoir un paiement"}
                icon={ArrowDownToLine}
              />
            </ul>
          </section>

          {data?.monthlySummary && <MonthlySummaryCard summary={data.monthlySummary} />}

          <section aria-labelledby="activity-heading" className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="activity-heading" className="text-heading-sm text-foreground">
                {en ? "Recent activity" : "Activité récente"}
              </h2>
              <Link to="/app/transactions" className="text-caption text-primary hover:underline">
                {en ? "Full history" : "Tout l'historique"}
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
     "flex h-full min-h-28 flex-col justify-between rounded-md border border-border bg-surface p-4 text-sm";

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
           className={`${className} press-feedback text-foreground transition-colors hover:border-brand hover:shadow-[var(--shadow-card)] active:press-feedback-active`}
        >
          {content}
        </Link>
      )}
    </li>
  );
}
