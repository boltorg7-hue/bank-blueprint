import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { Input } from "@/components/ui/input";
const AdminAccountsTable = lazy(() => import("@/features/admin/components/AdminAccountsTable").then((module) => ({ default: module.AdminAccountsTable })));
import { AdminGate } from "@/features/admin/components/AdminGate";
import { useAdminAccounts } from "@/features/admin/hooks/useAdmin";

export const Route = createFileRoute("/admin/accounts")({ component: AdminAccountsPage, head: () => ({ meta: [{ title: "Comptes — Back-office" }, { name: "robots", content: "noindex, nofollow" }] }) });
function AdminAccountsPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  useEffect(() => { setCursor(null); setCursorHistory([]); }, [search]);
  const query = useAdminAccounts(search, cursor);
  return <AdminGate permission="accounts.read"><PageSection><PageHeader title={en ? "Bank accounts" : "Comptes bancaires"} description={en ? "Ledger balances, available funds and reserved amounts." : "Soldes comptables, disponibles et réservés issus du ledger."} action={<Input aria-label={en ? "Search accounts" : "Rechercher un compte"} placeholder={en ? "Reference or number" : "Référence ou numéro"} value={search} onChange={(event) => setSearch(event.target.value)} className="w-full sm:w-72" />} />
    {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !query.data?.items?.length ? <div className="space-y-3"><EmptyState title={search.trim() ? (en ? "No account matches this search" : "Aucun compte ne correspond à cette recherche") : (en ? "No accounts found" : "Aucun compte trouvé")} />{search.trim() ? <div className="flex justify-center"><Button variant="ghost" onClick={() => setSearch("")}>{en ? "Clear search" : "Effacer la recherche"}</Button></div> : null}</div> : <div className="space-y-4"><Suspense fallback={<LoadingState />}><AdminAccountsTable accounts={query.data.items} /></Suspense><div className="flex justify-center gap-2">{cursor ? <Button variant="outline" onClick={() => { const previous = cursorHistory.at(-1) ?? null; setCursorHistory((items) => items.slice(0, -1)); setCursor(previous); }}>{en ? "Previous" : "Précédent"}</Button> : null}<Button variant="outline" disabled={!query.data.hasNext || !query.data.nextCursor} onClick={() => { if (!query.data.nextCursor) return; setCursorHistory((items) => [...items, cursor ?? ""]); setCursor(query.data.nextCursor); }}>{en ? "Next" : "Suivant"}</Button></div></div> }
    </PageSection>
  </AdminGate>;
}
