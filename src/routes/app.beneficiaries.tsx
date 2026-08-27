import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PermissionDeniedState } from "@/components/feedback";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import {
  isAllowed,
  transactionalBlockedReason,
} from "@/features/customer-shell/lib/route-access";
import { AddBeneficiaryDialog } from "@/features/beneficiaries/components/AddBeneficiaryDialog";
import { AddExternalBeneficiaryDialog } from "@/features/beneficiaries/components/AddExternalBeneficiaryDialog";
import { BeneficiaryList } from "@/features/beneficiaries/components/BeneficiaryList";

export const Route = createFileRoute("/app/beneficiaries")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Bénéficiaires — RFC Royal FINANCE Bank" },
      {
        name: "description",
        content: "Gérez les comptes vers lesquels vous pouvez envoyer de l'argent.",
      },
    ],
  }),
  component: AppBeneficiariesRoute,
});

function AppBeneficiariesRoute() {
  const { summary } = useCustomerSummary();
  const allowed = summary ? isAllowed(summary.lifecycleState, "transactional") : true;
  const blockedReason = summary ? transactionalBlockedReason(summary.lifecycleState) : null;

  return (
    <BankingContentContainer width="default">
      <PageHeader
        title="Bénéficiaires"
        description="Les comptes vers lesquels vous pouvez envoyer de l'argent. Seules les dernières décimales du compte sont affichées."
        action={
          allowed ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <AddBeneficiaryDialog />
              <AddExternalBeneficiaryDialog />
            </div>
          ) : undefined
        }
      />
      {allowed ? (
        <BeneficiaryList action={<AddBeneficiaryDialog />} />
      ) : (
        <PermissionDeniedState description={blockedReason ?? undefined} />
      )}
    </BankingContentContainer>
  );
}
