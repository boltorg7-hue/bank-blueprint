import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { ProfilePage } from "@/features/profile/components/ProfilePage";

export const Route = createFileRoute("/app/profile/")({
  component: () => (
    <BankingContentContainer width="wide">
      <ProfilePage />
    </BankingContentContainer>
  ),
});
