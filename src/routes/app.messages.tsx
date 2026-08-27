import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/messages")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Messages — RFC" },
      { name: "description", content: "Votre messagerie sécurisée avec la banque." },
    ],
  }),
  component: AppMessagesRoute,
});

function AppMessagesRoute() {
  return (
    <FeatureShellPage
      title="Messages"
      description="Votre messagerie sécurisée avec la banque."
      access="authenticated"
      width="default"
    />
  );
}
