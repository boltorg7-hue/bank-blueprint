import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui";
import { PermissionDeniedState } from "@/components/feedback";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { isAllowed } from "@/features/customer-shell/lib/route-access";
import { TransactionHistory } from "@/features/transactions/components/TransactionHistory";

export const Route = createFileRoute("/app/activity")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Activité — RFC Royal FINANCE Bank" },
      {
        name: "description",
        content: "Consultez les mouvements récents enregistrés sur vos comptes.",
      },
    ],
  }),
  component: AppActivityRoute,
});

function AppActivityRoute() {
  const { language } = useLanguage();
  const en = language === "en";
  const { summary } = useCustomerSummary();
  const allowed = summary ? isAllowed(summary.lifecycleState, "banking-read") : true;

  return (
    <BankingContentContainer width="default">
      <PageHeader
        title={en ? "Activity" : "Activité"}
        description={
          en
            ? "Follow the transactions recorded across your accounts."
            : "Suivez les opérations enregistrées sur l'ensemble de vos comptes."
        }
      />

      {allowed ? (
        <>
          <section
            aria-label={en ? "Recent activity" : "Activité récente"}
            className="mb-5 flex items-center gap-3 rounded-2xl border border-brand/10 bg-gradient-to-r from-brand/5 via-surface to-surface p-4 sm:mb-7 sm:p-5"
          >
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"
            >
              <Activity className="size-5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-overline font-semibold tracking-wide text-brand">
                {en ? "RECENT ACTIVITY" : "FIL D’ACTIVITÉ"}
              </p>
              <p className="mt-1 text-body-sm leading-relaxed text-foreground">
                {en
                  ? "Select a transaction to view its recorded details."
                  : "Sélectionnez une opération pour consulter les informations qui lui sont associées."}
              </p>
            </div>
          </section>
          <PageSection>
            <TransactionHistory
              pageSize={10}
              showFilters={false}
              emptyTitle={en ? "No activity yet" : "Aucune activité pour le moment"}
              emptyDescription={
                en
                  ? "Your activity will appear here when a transaction is recorded on your accounts."
                  : "Votre activité apparaîtra ici lorsqu’une opération sera enregistrée sur vos comptes."
              }
            />
          </PageSection>
        </>
      ) : (
        <PageSection>
          <PermissionDeniedState
            description={
              en
                ? "Your banking activity will be visible once your account is activated."
                : "Votre activité bancaire sera visible dès l'activation de votre compte."
            }
          />
        </PageSection>
      )}
    </BankingContentContainer>
  );
}
