import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Profil — RFC" },
      { name: "description", content: "Vos informations personnelles et vos coordonnées." },
    ],
  }),
  component: AppProfileRoute,
});

function AppProfileRoute() {
  return (
    <FeatureShellPage
      title="Profil"
      description="Vos informations personnelles et vos coordonnées."
      access="authenticated"
      width="narrow"
    />
  );
}
