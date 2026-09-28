import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";


import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PermissionDeniedState } from "@/components/feedback";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { isAllowed } from "@/features/customer-shell/lib/route-access";
import { TransactionHistory } from "@/features/transactions/components/TransactionHistory";

export const Route = createFileRoute("/app/transactions/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Opérations — RFC Royal FINANCE Bank" },
      {
        name: "description",
        content: "Consultez et filtrez l'historique détaillé de vos opérations bancaires.",
      },
    ],
  }),
  component: TransactionsIndexRoute,
});

function TransactionsIndexRoute() {
  const { language } = useLanguage();
  const en = language === "en";
  const { summary } = useCustomerSummary();
  const allowed = summary ? isAllowed(summary.lifecycleState, "banking-read") : true;

  return (
    <BankingContentContainer width="default">
      <PageHeader
        title={en ? "Transactions" : "Opérations"}
        description={en ? "Your complete transaction history, newest first." : "L'historique complet de vos opérations, du plus récent au plus ancien."}
      />
      {allowed ? (
        <TransactionHistory />
      ) : (
        <PermissionDeniedState description={en ? "Your transaction history will be available once your account is activated." : "L'historique de vos opérations sera disponible dès l'activation de votre compte."} />
      )}
    </BankingContentContainer>
  );
}
