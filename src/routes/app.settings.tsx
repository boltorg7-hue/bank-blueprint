import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { PreferencesPage } from "@/features/profile/components/PreferencesPage";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Préférences — RFC" },
      { name: "description", content: "Langue, affichage et préférences de notification." },
    ],
  }),
  component: AppSettingsRoute,
});

function AppSettingsRoute() {
  return <BankingContentContainer width="default"><PreferencesPage /></BankingContentContainer>;
}
