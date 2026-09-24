import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { AdminCustomersTable } from "@/features/admin/components/AdminCustomersTable";
import { useAdminCustomers } from "@/features/admin/hooks/useAdmin";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomersPage, head: () => ({ meta: [{ title: "Clients — Back-office" }, { name: "robots", content: "noindex, nofollow" }] }) });
function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const query = useAdminCustomers(search);
  return <AdminGate permission="customers.read"><PageHeader title="Clients" description="Profils clients, états d’ouverture et nombre de comptes." action={<Input aria-label="Rechercher un client" placeholder="Nom, e-mail ou référence" value={search} onChange={(event) => setSearch(event.target.value)} className="w-72" />} />
    {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !query.data?.length ? <EmptyState title="Aucun client trouvé" /> : <AdminCustomersTable customers={query.data} />}
  </AdminGate>;
}
