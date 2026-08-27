import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/transfers")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Virements — RFC" },
      { name: "description", content: "Vos virements en préparation, planifiés et exécutés." },
    ],
  }),
  component: AppTransfersIndexRoute,
});

function AppTransfersIndexRoute() {
  return (
    <FeatureShellPage
      title="Virements"
      description="Vos virements en préparation, planifiés et exécutés."
      access="transactional"
      width="default"
    />
  );
}
