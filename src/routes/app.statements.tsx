import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/statements")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Relevés — RFC" },
      { name: "description", content: "Vos relevés de compte périodiques, prêts à télécharger." },
    ],
  }),
  component: AppStatementsRoute,
});

function AppStatementsRoute() {
  return (
    <FeatureShellPage
      title="Relevés"
      description="Vos relevés de compte périodiques, prêts à télécharger."
      access="banking-read"
      width="default"
    />
  );
}
