import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { ProfilePersonalPage } from "@/features/profile/components/ProfilePersonalPage";

export const Route = createFileRoute("/app/profile/personal")({
  head: () => ({
    meta: [
      { title: "Informations personnelles — RFC" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <BankingContentContainer width="wide">
      <ProfilePersonalPage />
    </BankingContentContainer>
  ),
});
