import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";
import { StatementPreview } from "@/features/statements/components/StatementPreview";

export const Route = createFileRoute("/app/statements/$statementRef")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Relevé de compte — RFC" },
      { name: "description", content: "Détail d'un relevé de compte officiel." },
    ],
  }),
  component: StatementDetailRoute,
});

function StatementDetailRoute() {
  const { statementRef } = Route.useParams();
  return (
    <FeatureShellPage
      title="Relevé de compte"
      description="Document officiel figé à l'émission."
      access="banking-read"
      width="default"
      backTo="/app/statements"
    >
      <StatementPreview reference={statementRef} />
    </FeatureShellPage>
  );
}
