import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";


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
  const { language } = useLanguage();
  const en = language === "en";
  const query = useAdminDashboard();
  return (
    <AdminGate permission="admin.access">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          title={en ? "Operations overview" : "Console opérationnelle"}
          description={en ? "An overview of customers, accounts and pending funding requests." : "Vue contrôlée des clients, comptes et approvisionnements en attente."}
        />
        {query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-6">
            <KpiCard
              label={en ? "Customers" : "Clients"}
              value={query.data?.customers ?? 0}
              hint={`${query.data?.activeCustomers ?? 0} ${en ? "active" : "actifs"}`}
              icon={Users}
              loading={query.isPending}
            />
            <KpiCard
              label={en ? "Bank accounts" : "Comptes bancaires"}
              value={query.data?.accounts ?? 0}
              hint={`${query.data?.activeAccounts ?? 0} ${en ? "active" : "actifs"}`}
              icon={Wallet}
              loading={query.isPending}
            />
            <KpiCard
              label={en ? "Funding requests" : "Approvisionnements"}
              value={query.data?.pendingFunding ?? 0}
              hint={formatMoneyFromMinor(query.data?.pendingFundingMinor ?? 0, { currency: "USD" })}
              icon={CircleDollarSign}
              loading={query.isPending}
            />
            <KpiCard
              label={en ? "Controls" : "Contrôle"}
              value="Maker-checker"
              hint={en ? "Dual approval" : "Double validation"}
              icon={UserRoundCheck}
            />
          </div>
        )}
      </div>
    </AdminGate>
  );
}
