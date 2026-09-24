import { createFileRoute } from "@tanstack/react-router";

import { CircleDollarSign, UserRoundCheck, Users, Wallet } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/feedback";
import { KpiCard } from "@/components/data-display/KpiCard";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { useAdminDashboard } from "@/features/admin/hooks/useAdmin";
import { formatMoneyFromMinor } from "@/lib/format";

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
  const query = useAdminDashboard();
  return (
    <AdminGate permission="admin.access"><div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Console opérationnelle"
        description="Vue contrôlée des clients, comptes et approvisionnements en attente."
      />
      {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Clients" value={query.data?.customers ?? 0} hint={`${query.data?.activeCustomers ?? 0} actifs`} icon={Users} loading={query.isPending} />
        <KpiCard label="Comptes bancaires" value={query.data?.accounts ?? 0} hint={`${query.data?.activeAccounts ?? 0} actifs`} icon={Wallet} loading={query.isPending} />
        <KpiCard label="Approvisionnements en attente" value={query.data?.pendingFunding ?? 0} hint={formatMoneyFromMinor(query.data?.pendingFundingMinor ?? 0, { currency: "USD" })} icon={CircleDollarSign} loading={query.isPending} />
        <KpiCard label="Contrôle" value="Maker-checker" hint="Deux acteurs distincts" icon={UserRoundCheck} />
      </div>}
    </div></AdminGate>
  );
}
