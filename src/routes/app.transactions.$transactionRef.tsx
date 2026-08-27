import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/feedback";
import { TransactionDetailCard } from "@/features/transactions/components/TransactionDetailCard";
import { useTransactionDetail } from "@/features/transactions/hooks/useTransactions";

export const Route = createFileRoute("/app/transactions/$transactionRef")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Détail de l'opération — RFC Royal FINANCE Bank" },
      {
        name: "description",
        content: "Le détail complet d'une opération enregistrée sur votre compte.",
      },
    ],
  }),
  component: TransactionDetailRoute,
});

function TransactionDetailRoute() {
  const { transactionRef } = Route.useParams();
  const { data, isPending, isError, refetch } = useTransactionDetail(transactionRef);

  return (
    <BankingContentContainer width="narrow">
      <PageHeader
        title="Détail de l'opération"
        description="Les informations enregistrées pour cette opération."
        backTo="/app/transactions"
      />

      {isPending ? (
        <SkeletonBlock lines={6} />
      ) : isError ? (
        <ErrorState
          title="Opération momentanément indisponible"
          description="Nous n'avons pas pu charger cette opération. Réessayez dans un instant."
          onRetry={() => void refetch()}
        />
      ) : !data ? (
        <EmptyState
          title="Opération introuvable"
          description="Cette référence ne correspond à aucune opération de vos comptes."
        />
      ) : (
        <TransactionDetailCard transaction={data} />
      )}
    </BankingContentContainer>
  );
}
