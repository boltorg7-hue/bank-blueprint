import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui/page-section";
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
  const { language } = useLanguage();
  const en = language === "en";
  const { transactionRef } = Route.useParams();
  const { data, isPending, isError, refetch } = useTransactionDetail(transactionRef);

  return (
    <BankingContentContainer width="narrow">
      <PageHeader
        title={en ? "Transaction details" : "Détail de l'opération"}
        description={en ? "The recorded details of this transaction." : "Les informations enregistrées pour cette opération."}
        backTo="/app/transactions"
      />

      <PageSection>
      {isPending ? (
        <SkeletonBlock lines={6} />
      ) : isError ? (
        <ErrorState
          title={en ? "Transaction temporarily unavailable" : "Opération momentanément indisponible"}
          description={en ? "We could not load this transaction. Please try again shortly." : "Nous n'avons pas pu charger cette opération. Réessayez dans un instant."}
          onRetry={() => void refetch()}
        />
      ) : !data ? (
        <EmptyState
          title={en ? "Transaction not found" : "Opération introuvable"}
          description={en ? "This reference does not match any transaction on your accounts." : "Cette référence ne correspond à aucune opération de vos comptes."}
        />
      ) : (
        <TransactionDetailCard transaction={data} />
      )}
      </PageSection>
    </BankingContentContainer>
  );
}
