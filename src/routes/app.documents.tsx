import { createFileRoute } from "@tanstack/react-router";

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
  return (
    <FeatureShellPage
      title="Documents"
      description="Vos relevés, reçus et courriers bancaires, accessibles de façon sécurisée."
      access="banking-read"
      width="default"
    >
      <DocumentList />
    </FeatureShellPage>
  );
}
