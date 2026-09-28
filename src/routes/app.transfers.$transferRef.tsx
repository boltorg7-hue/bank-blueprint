import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();
  const en = language === "en";
  const { transferRef } = Route.useParams();
  const { summary } = useCustomerSummary();
  const allowed = summary ? isAllowed(summary.lifecycleState, "banking-read") : true;

  return (
    <BankingContentContainer width="narrow">
      <PageHeader
        title={en ? "Transfer details" : "Détail du virement"}
        description={en ? "The amount and recipient of a confirmed transfer cannot be changed." : "Le montant et le bénéficiaire d'un virement confirmé ne peuvent plus être modifiés."}
        backTo="/app/transfers"
      />
      {allowed ? (
        <TransferDetail reference={transferRef} />
      ) : (
        <PermissionDeniedState description={en ? "Transfer details will be available when your account is activated." : "Le détail de vos virements sera disponible dès l'activation de votre compte."} />
      )}
    </BankingContentContainer>
  );
}
