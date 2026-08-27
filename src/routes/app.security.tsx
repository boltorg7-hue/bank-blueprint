import { createFileRoute } from "@tanstack/react-router";

import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";

export const Route = createFileRoute("/app/security")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Sécurité — RFC" },
      { name: "description", content: "Vos appareils, sessions actives et paramètres de sécurité." },
    ],
  }),
  component: AppSecurityRoute,
});

function AppSecurityRoute() {
  return (
    <FeatureShellPage
      title="Sécurité"
      description="Vos appareils, sessions actives et paramètres de sécurité."
      access="authenticated"
      width="narrow"
    />
  );
}
