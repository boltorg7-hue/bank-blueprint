import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { useEffect, useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { AdminCustomersTable } from "@/features/admin/components/AdminCustomersTable";
import { useAdminCustomers } from "@/features/admin/hooks/useAdmin";
import { CUSTOMER_LIFECYCLE_STATES, LIFECYCLE_LABELS, type CustomerLifecycleState } from "@/types/customer-lifecycle";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomersPage, head: () => ({ meta: [{ title: "Clients — Back-office" }, { name: "robots", content: "noindex, nofollow" }] }) });

function AdminCustomersPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lifecycle, setLifecycle] = useState<"ALL" | CustomerLifecycleState>("ALL");
  const [accounts, setAccounts] = useState<"ALL" | "WITH_ACCOUNTS" | "WITHOUT_ACCOUNTS">("ALL");
  const [attention, setAttention] = useState<"ALL" | "NEEDS_ATTENTION" | "CLEAR">("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useAdminCustomers(debouncedSearch, page, lifecycle, accounts, attention);
  const customers = useMemo(() => {
    return [...(query.data?.items ?? [])].sort((a, b) => {
      const countDelta = b.attentionCount - a.attentionCount;
      if (countDelta !== 0) return countDelta;
      if (a.oldestAttentionAt && b.oldestAttentionAt) return Date.parse(a.oldestAttentionAt) - Date.parse(b.oldestAttentionAt);
      if (a.oldestAttentionAt) return -1;
      if (b.oldestAttentionAt) return 1;
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }, [query.data]);

  const hasFilters = Boolean(search.trim()) || lifecycle !== "ALL" || accounts !== "ALL" || attention !== "ALL";
  useEffect(() => { setPage(1); }, [debouncedSearch, lifecycle, accounts, attention]);

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setLifecycle("ALL");
    setAccounts("ALL");
    setAttention("ALL");
  };

  return <AdminGate permission="customers.read"><PageSection>
    <PageHeader
      title={en ? "Customers" : "Clients"}
      description={en ? "Find a customer, narrow the operational list and open the full dossier." : "Retrouvez un client, affinez la liste opérationnelle et ouvrez son dossier complet."}
      action={
        <div className="grid w-full gap-2 sm:grid-cols-[minmax(14rem,1fr)_11rem_11rem_11rem]">
          <Input
            aria-label={en ? "Search customers" : "Rechercher un client"}
            placeholder={en ? "Name, email, phone or reference" : "Nom, e-mail, téléphone ou référence"}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={lifecycle} onValueChange={(value) => setLifecycle(value as "ALL" | CustomerLifecycleState)}>
            <SelectTrigger aria-label={en ? "Filter by lifecycle" : "Filtrer par cycle de vie"}><SelectValue placeholder={en ? "Lifecycle" : "Cycle de vie"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{en ? "All lifecycle states" : "Tous les états"}</SelectItem>
              {CUSTOMER_LIFECYCLE_STATES.map((state) => <SelectItem key={state} value={state}>{en ? state.replaceAll("_", " ") : LIFECYCLE_LABELS[state]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={attention} onValueChange={(value) => setAttention(value as "ALL" | "NEEDS_ATTENTION" | "CLEAR")}>
            <SelectTrigger aria-label={en ? "Filter by operational attention" : "Filtrer par action requise"}><SelectValue placeholder={en ? "Attention" : "Action requise"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{en ? "All operational states" : "Tous les états opérationnels"}</SelectItem>
              <SelectItem value="NEEDS_ATTENTION">{en ? "Needs attention" : "Action requise"}</SelectItem>
              <SelectItem value="CLEAR">{en ? "No immediate action" : "Aucune action immédiate"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={accounts} onValueChange={(value) => setAccounts(value as "ALL" | "WITH_ACCOUNTS" | "WITHOUT_ACCOUNTS")}>
            <SelectTrigger aria-label={en ? "Filter by accounts" : "Filtrer par comptes"}><SelectValue placeholder={en ? "Accounts" : "Comptes"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{en ? "All customers" : "Tous les clients"}</SelectItem>
              <SelectItem value="WITH_ACCOUNTS">{en ? "With accounts" : "Avec compte"}</SelectItem>
              <SelectItem value="WITHOUT_ACCOUNTS">{en ? "Without accounts" : "Sans compte"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    />
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
      <p className="text-sm text-muted-foreground">
        {customers.length} {en ? (customers.length === 1 ? "customer" : "customers") : (customers.length === 1 ? "client" : "clients")}
        {hasFilters && query.data ? `${query.data.items.length} ${en ? "loaded" : "chargés"}` : ""}
      </p>
      <div className="flex items-center gap-2">{page > 1 ? <Button type="button" variant="outline" onClick={() => setPage((value) => value - 1)}>{en ? "Previous" : "Précédent"}</Button> : null}<Button type="button" variant="outline" disabled={!query.data?.hasNext} onClick={() => setPage((value) => value + 1)}>{en ? "Next" : "Suivant"}</Button>{hasFilters ? <Button type="button" variant="ghost" onClick={clearFilters}>{en ? "Clear filters" : "Réinitialiser les filtres"}</Button> : null}</div>
    </div>
    {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !customers.length ? <EmptyState title={en ? (hasFilters ? "No customer matches these filters" : "No customers found") : (hasFilters ? "Aucun client ne correspond à ces filtres" : "Aucun client trouvé")} /> : <AdminCustomersTable customers={customers} />}
  </PageSection></AdminGate>;
}
