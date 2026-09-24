import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { AdminAccountsTable } from "@/features/admin/components/AdminAccountsTable";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { useAdminAccounts } from "@/features/admin/hooks/useAdmin";

export const Route = createFileRoute("/admin/accounts")({ component: AdminAccountsPage, head: () => ({ meta: [{ title: "Comptes — Back-office" }, { name: "robots", content: "noindex, nofollow" }] }) });
function AdminAccountsPage() {
  const [search, setSearch] = useState("");
  const query = useAdminAccounts(search);
  return <AdminGate permission="accounts.read"><PageHeader title="Comptes bancaires" description="Soldes comptables, disponibles et réservés issus du ledger." action={<Input aria-label="Rechercher un compte" placeholder="Référence ou numéro" value={search} onChange={(event) => setSearch(event.target.value)} className="w-72" />} />
    {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !query.data?.length ? <EmptyState title="Aucun compte trouvé" /> : <AdminAccountsTable accounts={query.data} />}
  </AdminGate>;
}
