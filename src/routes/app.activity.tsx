import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/activity")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Activité — RFC" },
      { name: "description", content: "Le fil de vos opérations récentes, toutes catégories confondues." },
    ],
  }),
  component: AppActivityRoute,
});

function AppActivityRoute() {
  return (
    <FeatureShellPage
      title="Activité"
      description="Le fil de vos opérations récentes, toutes catégories confondues."
      access="banking-read"
      width="default"
    />
  );
}
