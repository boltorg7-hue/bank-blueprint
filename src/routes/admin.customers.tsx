import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { AdminCustomersTable } from "@/features/admin/components/AdminCustomersTable";
import { useAdminCustomers } from "@/features/admin/hooks/useAdmin";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomersPage, head: () => ({ meta: [{ title: "Clients — Back-office" }, { name: "robots", content: "noindex, nofollow" }] }) });
function AdminCustomersPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const [search, setSearch] = useState("");
  const query = useAdminCustomers(search);
  return <AdminGate permission="customers.read"><PageHeader title={en ? "Customers" : "Clients"} description={en ? "Customer profiles, account-opening statuses and account counts." : "Profils clients, états d’ouverture et nombre de comptes."} action={<Input aria-label={en ? "Search customers" : "Rechercher un client"} placeholder={en ? "Name, email or reference" : "Nom, e-mail ou référence"} value={search} onChange={(event) => setSearch(event.target.value)} className="w-full sm:w-72" />} />
    {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !query.data?.length ? <EmptyState title={en ? "No customers found" : "Aucun client trouvé"} /> : <AdminCustomersTable customers={query.data} />}
  </AdminGate>;
}
