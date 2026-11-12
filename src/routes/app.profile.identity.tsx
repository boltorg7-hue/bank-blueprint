import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { ProfileIdentityPage } from "@/features/profile/components/ProfileIdentityPage";

export const Route = createFileRoute("/app/profile/identity")({
  head: () => ({
    meta: [
      { title: "Identité et photo — RFC" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <BankingContentContainer width="wide">
      <ProfileIdentityPage />
    </BankingContentContainer>
  ),
});
