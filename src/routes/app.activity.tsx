import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
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
        content: "Le fil de vos opérations récentes, toutes catégories confondues.",
      },
    ],
  }),
  component: AppActivityRoute,
});

function AppActivityRoute() {
  const { summary } = useCustomerSummary();
  const allowed = summary ? isAllowed(summary.lifecycleState, "banking-read") : true;

  return (
    <BankingContentContainer width="default">
      <PageHeader
        title="Activité"
        description="Le fil de vos opérations récentes, toutes catégories confondues."
      />
      {allowed ? (
        <TransactionHistory pageSize={10} showFilters={false} />
      ) : (
        <PermissionDeniedState description="Votre activité bancaire sera visible dès l'activation de votre compte." />
      )}
    </BankingContentContainer>
  );
}
