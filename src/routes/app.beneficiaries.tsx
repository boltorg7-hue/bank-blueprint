import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/beneficiaries")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Bénéficiaires — RFC" },
      { name: "description", content: "Les comptes vers lesquels vous pouvez envoyer de l'argent." },
    ],
  }),
  component: AppBeneficiariesRoute,
});

function AppBeneficiariesRoute() {
  return (
    <FeatureShellPage
      title="Bénéficiaires"
      description="Les comptes vers lesquels vous pouvez envoyer de l'argent."
      access="transactional"
      width="default"
    />
  );
}
