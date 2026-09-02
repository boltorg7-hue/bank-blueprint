import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";
import { StatementGenerator } from "@/features/statements/components/StatementGenerator";
import { StatementList } from "@/features/statements/components/StatementList";

export const Route = createFileRoute("/app/statements/")({
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
      description="Vos relevés de compte officiels, figés à l'émission et prêts à télécharger."
      access="banking-read"
      width="default"
    >
      <div className="space-y-5">
        <StatementGenerator />
        <StatementList />
      </div>
    </FeatureShellPage>
  );
}
