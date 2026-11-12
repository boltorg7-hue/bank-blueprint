import { createFileRoute } from "@tanstack/react-router";
import { Landmark, ShieldCheck } from "lucide-react";
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
  head: () => ({
    meta: [
      { title: "Mes comptes — RFC Royal FINANCE Bank" },
      { name: "description", content: "Consultez vos comptes bancaires et leurs soldes." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
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
      <PageHeader
        title={en ? "My accounts" : "Mes comptes"}
        description={
          en
            ? "Your accounts, balances and banking details."
            : "Retrouvez vos comptes, leurs soldes et leurs coordonnées bancaires."
        }
      />
      <div className="mb-5 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-brand/10 bg-gradient-to-r from-brand/5 via-surface to-surface p-4 sm:mb-7 sm:p-5">
        <div className="min-w-0">
          <p className="text-overline font-semibold tracking-wide text-brand">
            {en ? "YOUR BANKING ACCOUNTS" : "VOS COMPTES BANCAIRES"}
          </p>
          <p className="mt-1.5 max-w-2xl text-body-sm leading-relaxed text-foreground">
            {en
              ? "Select an account to review its available balance, status and banking details."
              : "Sélectionnez un compte pour consulter son solde disponible, son statut et ses coordonnées."}
          </p>
        </div>
        <div
          className="relative mr-1 flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand sm:size-16"
          aria-hidden="true"
        >
          <Landmark className="size-7 sm:size-8" strokeWidth={1.7} />
          <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-surface bg-success text-success-foreground">
            <ShieldCheck className="size-3.5" strokeWidth={2.2} />
          </span>
        </div>
      </div>
      <PageSection>
        {!allowed ? (
          <PermissionDeniedState
            description={
              en
                ? "This section is not available with your current account status."
                : "Cette section n'est pas disponible avec le statut actuel de votre compte."
            }
          />
        ) : query.isError ? (
          <ErrorState
            title={
              en ? "Your accounts could not be loaded" : "Vos comptes n'ont pas pu être chargés"
            }
            onRetry={() => query.refetch()}
          />
        ) : query.isPending ? (
          <LoadingState label={en ? "Loading your accounts…" : "Chargement de vos comptes…"} />
        ) : (query.data ?? []).length === 0 ? (
          <EmptyState
            title={en ? "No bank accounts" : "Aucun compte bancaire"}
            description={
              en
                ? "Your bank account will open once your application has been fully approved."
                : "Votre compte bancaire sera ouvert dès la validation complète de votre dossier."
            }
          />
        ) : (
          <ul className="space-y-3">
            {(query.data ?? []).map((account) => (
              <AccountListItem key={account.reference} account={account} />
            ))}
          </ul>
        )}
      </PageSection>
    </BankingContentContainer>
  );
}
