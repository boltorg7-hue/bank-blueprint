import { createFileRoute } from "@tanstack/react-router";

import { BankingContentContainer } from "@/components/layout/BankingAppLayout";
import { NotificationCenter } from "@/features/notifications/components/NotificationCenter";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Notifications — RFC" },
      { name: "description", content: "Les alertes de sécurité et informations liées à vos comptes." },
    ],
  }),
  component: AppNotificationsRoute,
});

function AppNotificationsRoute() {
  return <BankingContentContainer width="default"><NotificationCenter /></BankingContentContainer>;
}
