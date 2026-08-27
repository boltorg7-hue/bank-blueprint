import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { PermissionDeniedState } from "@/components/feedback";
import { useCustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import {
  isAllowed,
  transactionalBlockedReason,
} from "@/features/customer-shell/lib/route-access";
import { TransferList } from "@/features/transfers/components/TransferList";

export const Route = createFileRoute("/app/transfers/")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Virements — RFC Royal FINANCE Bank" },
      {
        name: "description",
        content: "Suivez vos virements en préparation et exécutés vers vos bénéficiaires.",
      },
    ],
  }),
  component: AppTransfersIndexRoute,
});

function AppTransfersIndexRoute() {
  const { summary } = useCustomerSummary();
  const allowed = summary ? isAllowed(summary.lifecycleState, "transactional") : true;
  const blockedReason = summary ? transactionalBlockedReason(summary.lifecycleState) : null;

  const newTransferButton = (
    <Button asChild>
      <Link to="/app/transfers/new">
        <Plus className="size-4" aria-hidden="true" />
        Nouveau virement
      </Link>
    </Button>
  );

  return (
    <BankingContentContainer width="default">
      <PageHeader
        title="Virements"
        description="Vos virements en préparation et exécutés, du plus récent au plus ancien."
        action={
          allowed ? (
            <>
              <Button variant="outline" asChild>
                <Link to="/app/beneficiaries">
                  <Users className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Bénéficiaires</span>
                </Link>
              </Button>
              {newTransferButton}
            </>
          ) : undefined
        }
      />
      {allowed ? (
        <TransferList action={newTransferButton} />
      ) : (
        <PermissionDeniedState description={blockedReason ?? undefined} />
      )}
    </BankingContentContainer>
  );
}
