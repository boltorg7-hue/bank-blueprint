import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";
import { SupportCenter } from "@/features/support/components/SupportCenter";

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
    <FeatureShellPage title="Service client" description="Échangez uniquement avec notre équipe d’assistance au sujet de votre compte et de vos opérations." access="authenticated" width="default">
      <SupportCenter />
    </FeatureShellPage>
  );
}
