import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";


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
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <FeatureShellPage title={en ? "Customer support" : "Service client"} description={en ? "Speak securely with our support team about your account and transactions." : "Échangez uniquement avec notre équipe d’assistance au sujet de votre compte et de vos opérations."} access="authenticated" width="default">
      <SupportCenter />
    </FeatureShellPage>
  );
}
