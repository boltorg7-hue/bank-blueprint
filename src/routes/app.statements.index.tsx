import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";


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
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <FeatureShellPage
      title={en ? "Statements" : "Relevés"}
      description={en ? "Your official account statements, finalized when issued and ready to download." : "Vos relevés de compte officiels, figés à l'émission et prêts à télécharger."}
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
