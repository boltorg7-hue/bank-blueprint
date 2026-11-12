import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { ProfileAddressPage } from "@/features/profile/components/ProfileAddressPage";

export const Route = createFileRoute("/app/profile/address")({
  head: () => ({
    meta: [{ title: "Adresse principale — RFC" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: () => (
    <BankingContentContainer width="wide">
      <ProfileAddressPage />
    </BankingContentContainer>
  ),
});
