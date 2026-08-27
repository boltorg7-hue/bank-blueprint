import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/transactions")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Opérations — RFC" },
      { name: "description", content: "La liste détaillée de vos opérations bancaires." },
    ],
  }),
  component: AppTransactionsRoute,
});

function AppTransactionsRoute() {
  return (
    <FeatureShellPage
      title="Opérations"
      description="La liste détaillée de vos opérations bancaires."
      access="banking-read"
      width="default"
    />
  );
}
