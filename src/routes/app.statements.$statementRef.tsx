import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();
  const { statementRef } = Route.useParams();
  return (
    <FeatureShellPage
      title={language === "en" ? "Account statement" : "Relevé de compte"}
      description={language === "en" ? "Official document finalized when issued." : "Document officiel figé à l'émission."}
      access="banking-read"
      width="default"
      backTo="/app/statements"
    >
      <StatementPreview reference={statementRef} />
    </FeatureShellPage>
  );
}
