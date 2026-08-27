import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PermissionDeniedState } from "@/components/feedback";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { isAllowed } from "@/features/customer-shell/lib/route-access";
import { TransferDetail } from "@/features/transfers/components/TransferDetail";

export const Route = createFileRoute("/app/transfers/$transferRef")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Détail du virement — RFC Royal FINANCE Bank" },
      {
        name: "description",
        content: "Récapitulatif, statut et suivi détaillé de votre virement.",
      },
    ],
  }),
  component: AppTransferDetailRoute,
});

function AppTransferDetailRoute() {
  const { transferRef } = Route.useParams();
  const { summary } = useCustomerSummary();
  const allowed = summary ? isAllowed(summary.lifecycleState, "banking-read") : true;

  return (
    <BankingContentContainer width="narrow">
      <PageHeader
        title="Détail du virement"
        description="Le montant et le bénéficiaire d'un virement confirmé ne peuvent plus être modifiés."
        backTo="/app/transfers"
      />
      {allowed ? (
        <TransferDetail reference={transferRef} />
      ) : (
        <PermissionDeniedState description="Le détail de vos virements sera disponible dès l'activation de votre compte." />
      )}
    </BankingContentContainer>
  );
}
