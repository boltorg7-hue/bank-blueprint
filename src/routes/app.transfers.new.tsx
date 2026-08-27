import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/transfers/new")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Nouveau virement — RFC" },
      { name: "description", content: "Initiez un virement vers un de vos bénéficiaires enregistrés." },
    ],
  }),
  component: AppTransfersNewRoute,
});

function AppTransfersNewRoute() {
  return (
    <FeatureShellPage
      title="Nouveau virement"
      description="Initiez un virement vers un de vos bénéficiaires enregistrés."
      access="transactional"
      width="narrow"
      backTo="/app/transfers"
    />
  );
}
