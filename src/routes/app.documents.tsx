import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

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
      description="Vos documents bancaires et justificatifs."
      access="banking-read"
      width="default"
    />
  );
}
