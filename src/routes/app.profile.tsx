import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { ProfilePage } from "@/features/profile/components/ProfilePage";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Profil — RFC" },
      { name: "description", content: "Vos informations personnelles et vos coordonnées." },
    ],
  }),
  component: AppProfileRoute,
});

function AppProfileRoute() {
  return <BankingContentContainer width="wide"><ProfilePage /></BankingContentContainer>;
}
