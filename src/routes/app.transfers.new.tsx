import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PermissionDeniedState } from "@/components/feedback";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import {
  isAllowed,
  transactionalBlockedReason,
} from "@/features/customer-shell/lib/route-access";
import { TransferWizard } from "@/features/transfers/components/TransferWizard";
import { BENEFICIARY_REFERENCE_PATTERN } from "@/features/beneficiaries/types/beneficiary";

type TransferSearch = { beneficiary?: string };

export const Route = createFileRoute("/app/transfers/new")({
  validateSearch: (search: Record<string, unknown>): TransferSearch => {
    const beneficiary = typeof search.beneficiary === "string" ? search.beneficiary : "";
    return BENEFICIARY_REFERENCE_PATTERN.test(beneficiary) ? { beneficiary } : {};
  },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Nouveau virement — RFC Royal FINANCE Bank" },
      {
        name: "description",
        content: "Initiez un virement vers un de vos bénéficiaires enregistrés.",
      },
    ],
  }),
  component: AppTransfersNewRoute,
});

function AppTransfersNewRoute() {
  const { beneficiary } = Route.useSearch();
  const { summary } = useCustomerSummary();
  const allowed = summary ? isAllowed(summary.lifecycleState, "transactional") : true;
  const blockedReason = summary ? transactionalBlockedReason(summary.lifecycleState) : null;

  return (
    <BankingContentContainer width="narrow">
      <PageHeader
        title="Nouveau virement"
        description="Vérifiez chaque étape : le montant est débité uniquement après votre confirmation."
        backTo="/app/transfers"
      />
      {allowed ? (
        <TransferWizard initialBeneficiary={beneficiary} />
      ) : (
        <PermissionDeniedState description={blockedReason ?? undefined} />
      )}
    </BankingContentContainer>
  );
}
