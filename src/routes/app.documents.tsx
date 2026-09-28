import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";


import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";
import { DocumentList } from "@/features/documents/components/DocumentList";

export const Route = createFileRoute("/app/documents")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Documents — RFC" },
      { name: "description", content: "Vos documents bancaires et justificatifs." },
    ],
  }),
  component: AppDocumentsRoute,
});

function AppDocumentsRoute() {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <FeatureShellPage
      title={en ? "Documents" : "Documents"}
      description={en ? "Your statements, receipts and bank correspondence, securely available." : "Vos relevés, reçus et courriers bancaires, accessibles de façon sécurisée."}
      access="banking-read"
      width="default"
    >
      <DocumentList />
    </FeatureShellPage>
  );
}
