import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";


import { FeatureShellPage } from "@/features/customer-shell/components/FeatureShellPage";
import { SecurityCenter } from "@/features/security/components/SecurityCenter";

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
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <FeatureShellPage
      title={en ? "Security" : "Sécurité"}
      description={en ? "Your devices, active sessions and security settings." : "Vos appareils, sessions actives et paramètres de sécurité."}
      access="authenticated"
      width="default"
    ><SecurityCenter /></FeatureShellPage>
  );
}
