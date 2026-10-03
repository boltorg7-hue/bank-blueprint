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
    <FeatureShellPage title={en ? "Messages" : "Messages"} description={en ? "Secure messages with your bank about your account and transactions." : "Échangez de façon sécurisée avec votre banque au sujet de votre compte et de vos opérations."} access="authenticated" width="default">
      <SupportCenter />
    </FeatureShellPage>
  );
}
