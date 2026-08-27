import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Préférences — RFC" },
      { name: "description", content: "Langue, affichage et préférences de notification." },
    ],
  }),
  component: AppSettingsRoute,
});

function AppSettingsRoute() {
  return (
    <FeatureShellPage
      title="Préférences"
      description="Langue, affichage et préférences de notification."
      access="authenticated"
      width="narrow"
    />
  );
}
