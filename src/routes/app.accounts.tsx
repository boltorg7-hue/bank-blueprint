import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/accounts")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Comptes — RFC" },
      { name: "description", content: "Vos comptes bancaires et leurs soldes, dès que le service de comptes sera connecté." },
    ],
  }),
  component: AppAccountsRoute,
});

function AppAccountsRoute() {
  return (
    <FeatureShellPage
      title="Comptes"
      description="Vos comptes bancaires et leurs soldes, dès que le service de comptes sera connecté."
      access="banking-read"
      width="wide"
    />
  );
}
