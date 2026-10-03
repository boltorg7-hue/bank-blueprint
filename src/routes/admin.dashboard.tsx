import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { CircleDollarSign, ShieldCheck, UserRoundCheck, Users, Wallet } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { ErrorState, LoadingState } from "@/components/feedback";
import { KpiCard } from "@/components/data-display/KpiCard";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { useAdminContext, useAdminDashboard } from "@/features/admin/hooks/useAdmin";
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

function roleLabel(role: string, en: boolean) {
  const labels: Record<string, [string, string]> = {
    super_admin: ["Super administrateur", "Super administrator"],
    administrator: ["Administrateur", "Administrator"],
    supervisor: ["Superviseur", "Supervisor"],
    finance_operator: ["Opérateur finance", "Finance operator"],
    compliance_officer: ["Conformité", "Compliance officer"],
    kyc_agent: ["Agent KYC", "KYC agent"],
    support_agent: ["Support", "Support agent"],
    auditor: ["Auditeur", "Auditor"],
  };
  return labels[role]?.[en ? 1 : 0] ?? role.replaceAll("_", " ");
}

function AdminDashboardShell() {
  const { language } = useLanguage();
  const en = language === "en";
  const staff = useAdminContext();
  const query = useAdminDashboard();

  return (
    <AdminGate permission="admin.access">
      <div className="mx-auto w-full max-w-6xl"><PageSection>
        <PageHeader
          title={en ? "Operations overview" : "Console opérationnelle"}
          description={
            en
              ? "A controlled view of customers, accounts and pending financial operations."
              : "Vue contrôlée des clients, comptes et opérations financières en attente."
          }
        />

        {staff.isPending ? (
          <LoadingState label={en ? "Loading staff context…" : "Chargement du profil opérationnel…"} />
        ) : staff.isError ? (\n          <ErrorState onRetry={() => staff.refetch()} />\n        ) : staff.data && (
          <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" aria-label={en ? "Staff context" : "Contexte du personnel"}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{staff.data.displayName ?? (en ? "Authorized staff" : "Personnel autorisé")}</p>
                  <p className="text-sm text-muted-foreground">
                    {staff.data.department ?? (en ? "Operations" : "Opérations")}
                    {staff.data.staffReference ? ` · ${staff.data.staffReference}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {staff.data.roles.map((role) => (
                  <span key={role} className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium">
                    {roleLabel(role, en)}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {query.isError ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-6">
            <KpiCard label={en ? "Customers" : "Clients"} value={query.data?.customers ?? 0} hint={`${query.data?.activeCustomers ?? 0} ${en ? "active" : "actifs"}`} icon={Users} loading={query.isPending} />
            <KpiCard label={en ? "Bank accounts" : "Comptes bancaires"} value={query.data?.accounts ?? 0} hint={`${query.data?.activeAccounts ?? 0} ${en ? "active" : "actifs"}`} icon={Wallet} loading={query.isPending} />
            <KpiCard label={en ? "Funding requests" : "Approvisionnements"} value={query.data?.pendingFunding ?? 0} hint={formatMoneyFromMinor(query.data?.pendingFundingMinor ?? 0, { currency: "USD" })} icon={CircleDollarSign} loading={query.isPending} />
            <KpiCard label={en ? "Controls" : "Contrôle"} value="Maker-checker" hint={en ? "Dual approval" : "Double validation"} icon={UserRoundCheck} />
          </div>
        )}
      </PageSection></div>
    </AdminGate>
  );
}
