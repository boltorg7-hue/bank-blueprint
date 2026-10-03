import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { Input } from "@/components/ui/input";
import { AdminAccountsTable } from "@/features/admin/components/AdminAccountsTable";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { useAdminAccounts } from "@/features/admin/hooks/useAdmin";

export const Route = createFileRoute("/admin/accounts")({ component: AdminAccountsPage, head: () => ({ meta: [{ title: "Comptes — Back-office" }, { name: "robots", content: "noindex, nofollow" }] }) });
function AdminAccountsPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const [search, setSearch] = useState("");
  const query = useAdminAccounts(search);
  return <AdminGate permission="accounts.read"><PageSection><PageHeader title={en ? "Bank accounts" : "Comptes bancaires"} description={en ? "Ledger balances, available funds and reserved amounts." : "Soldes comptables, disponibles et réservés issus du ledger."} action={<Input aria-label={en ? "Search accounts" : "Rechercher un compte"} placeholder={en ? "Reference or number" : "Référence ou numéro"} value={search} onChange={(event) => setSearch(event.target.value)} className="w-full sm:w-72" />} />
    {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !query.data?.length ? <EmptyState title={en ? "No accounts found" : "Aucun compte trouvé"} /> : <AdminAccountsTable accounts={query.data} />}
    </PageSection>
  </AdminGate>;
}
