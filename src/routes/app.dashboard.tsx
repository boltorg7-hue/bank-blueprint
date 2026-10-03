import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, FileText, Send, Wallet, Clock } from "lucide-react";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { EmptyState, ErrorState, LoadingState, StateBlock } from "@/components/feedback";
import { AccountBalanceCard } from "@/features/accounts/components/AccountBalanceCard";
import { MonthlySummaryCard } from "@/features/accounts/components/MonthlySummaryCard";
import { RecentActivityList } from "@/features/accounts/components/RecentActivityList";
import { useDashboardSummary } from "@/features/accounts/hooks/useAccounts";
import { ActionRequiredTransfers } from "@/features/transfers/components/ActionRequiredTransfers";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { isAllowed } from "@/features/customer-shell/lib/route-access";
import { accountAllowsTransactions, accountRestrictionMessage } from "@/features/accounts/utils/account-display";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import { formatAccountAmount, accountStatusLabel } from "@/features/accounts/utils/account-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePrivacyMode } from "@/components/providers/PrivacyModeProvider";
import { PRIVACY_PLACEHOLDER } from "@/lib/format/mask";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Espace client" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const { privacyMode } = usePrivacyMode();
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
        description={
          en
            ? "Your account, transactions and next steps in one place."
            : "Votre compte, vos opérations et vos prochaines actions au même endroit."
        }
      />

      <PageSection>
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
        <div className="space-y-6 sm:space-y-7 lg:space-y-10">
          <AccountBalanceCard
            account={account}
            isRefreshing={query.isFetching}
            isStale={query.isStale}
            onRetry={() => query.refetch()}
          />

          {restriction && (
            <p
              role="status"
              className="rounded-xl border border-warning/40 bg-warning-muted p-3.5 text-sm leading-relaxed text-warning sm:p-4"
            >
              {restriction}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <p className="text-body-sm text-muted-foreground">
              {en ? "Move money when you need it." : "Déplacez votre argent quand vous en avez besoin."}
            </p>
            <Link
              to="/app/transfers"
              aria-disabled={!canTransact}
              className={cn(
                "press-feedback inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:brightness-95",
                !canTransact && "pointer-events-none opacity-50",
              )}
            >
              <Send className="size-4" aria-hidden="true" />
              {en ? "Make a transfer" : "Faire un virement"}
            </Link>
          </div>

          <section aria-labelledby="accounts-heading" className="space-y-3.5 sm:space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 id="accounts-heading" className="text-heading-sm font-semibold text-foreground md:text-heading-md">
                {en ? "Accounts" : "Comptes"}
              </h2>
              <Link to="/app/accounts" className="shrink-0 text-caption font-medium text-brand hover:underline">
                {en ? "View all" : "Voir tous"}
              </Link>
            </div>
            <ul className="grid gap-3 md:grid-cols-2">
              {data.accounts.map((item) => {
                const amount = item.balance
                  ? privacyMode
                    ? PRIVACY_PLACEHOLDER
                    : formatAccountAmount(item.balance.availableBalanceMinor, item.currency, item.minorUnit)
                  : en ? "Unavailable" : "Indisponible";
                return (
                  <li key={item.reference}>
                    <Link
                      to="/app/accounts/$accountRef"
                      params={{ accountRef: item.reference }}
                      className="native-surface press-feedback block min-w-0 p-4 transition hover:border-brand/30 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-label truncate text-foreground">{item.displayName}</p>
                          <p className="text-caption text-numeric mt-0.5 text-muted-foreground">
                            {item.accountType === "CURRENT" ? (en ? "Current" : "Courant") : (en ? "Savings" : "Épargne")} · ••••{item.maskedNumber.slice(-4)}
                          </p>
                        </div>
                        <StatusBadge label={accountStatusLabel(item.status)} tone={item.status === "ACTIVE" ? "success" : "pending"} />
                      </div>
                      <p className="text-amount mt-5 text-foreground">{amount}</p>
                      <p className="text-caption mt-0.5 text-muted-foreground">
                        {en ? "Available balance" : "Solde disponible"}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {data?.monthlySummary && <MonthlySummaryCard summary={data.monthlySummary} />}

          <ActionRequiredTransfers />

          <section aria-labelledby="quick-actions-heading" className="space-y-3.5 sm:space-y-4">
            <div className="flex items-end justify-between gap-3">
              <h2 id="quick-actions-heading" className="text-heading-sm font-semibold text-foreground md:text-heading-md">
                {en ? "Actions & services" : "Actions et services"}
              </h2>
            </div>
            <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
              <QuickAction to="/app/transfers" label={en ? "Send money" : "Envoyer de l'argent"} icon={Send} disabled={!canTransact} />
              <QuickAction to="/app/accounts" label={en ? "My accounts" : "Mes comptes"} icon={Wallet} />
              <QuickAction to="/app/statements" label={en ? "Statements" : "Relevés"} icon={FileText} />
              <QuickAction to="/app/accounts/$accountRef" params={{ accountRef: account.reference }} label={en ? "Receive a payment" : "Recevoir un paiement"} icon={ArrowDownToLine} />
            </ul>
          </section>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 id="activity-heading" className="text-heading-sm font-semibold text-foreground md:text-heading-md">
                {en ? "Recent activity" : "Activité récente"}
              </h2>
              <Link to="/app/transactions" className="shrink-0 text-caption font-medium text-brand hover:underline">
                {en ? "Full history" : "Tout l'historique"}
              </Link>
            </div>
            <RecentActivityList items={data?.recentActivity ?? []} />
          </section>

          <p className="mt-8 text-center text-caption text-muted-foreground md:text-left">
            <Link to="/" className="hover:text-foreground hover:underline transition-colors">
              {en ? "Visit the bank's public site" : "Voir le site public de la banque"}
            </Link>
          </p>
        </div>
      )}
      </PageSection>
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
      <div className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors sm:size-9",
        !disabled ? "bg-brand/5 text-brand" : "bg-muted/50 text-muted-foreground",
      )}>
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="mt-3 min-w-0">
        <span className="block break-words font-semibold leading-tight tracking-tight">{label}</span>
        {disabled && <span className="mt-1 block text-caption font-medium opacity-70">Indisponible</span>}
      </div>
    </>
  );

  const baseClassName =
    "native-surface flex min-h-28 min-w-0 flex-col justify-between rounded-xl p-3 text-sm transition-all duration-200 sm:p-4";

  return (
    <li className="min-w-0">
      {disabled ? (
        <span aria-disabled="true" className={cn(baseClassName, "text-muted-foreground opacity-60")}>
          {content}
        </span>
      ) : (
        <Link
          to={to}
          {...(params ? { params } : {})}
          className={cn(
            baseClassName,
            "press-feedback text-foreground hover:border-brand/30 hover:shadow-sm active:press-feedback-active active:scale-[0.98]",
          )}
        >
          {content}
        </Link>
      )}
    </li>
  );
}
