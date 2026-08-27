import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Notifications — RFC" },
      { name: "description", content: "Les alertes de sécurité et informations liées à vos comptes." },
    ],
  }),
  component: AppNotificationsRoute,
});

function AppNotificationsRoute() {
  return (
    <FeatureShellPage
      title="Notifications"
      description="Les alertes de sécurité et informations liées à vos comptes."
      access="authenticated"
      width="default"
    />
  );
}
