import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, PermissionDeniedState } from "@/components/feedback";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Back-office" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboardShell,
});

function AdminDashboardShell() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Console opérationnelle"
        description="Coquille d'administration. Les modules clients, conformité et contrôles financiers arrivent aux phases 12 et 13."
      />

      {/*
        The real guard (staff roles verified server-side) is wired in PROMPT 12.
        Until then this screen states explicitly that access is not granted.
      */}
      <PermissionDeniedState description="L'autorisation du personnel n'est pas encore activée. Aucune donnée client n'est exposée à ce stade." />

      <div className="mt-6">
        <EmptyState
          title="Aucun indicateur disponible"
          description="Les files d'attente KYC, les contrôles de virements et les journaux d'audit apparaîtront ici une fois le back-office implémenté."
        />
      </div>
    </div>
  );
}
