import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { AdminOnboardingCases } from "@/features/admin/components/AdminOnboardingCases";
import { InviteCustomerDialog } from "@/features/admin/components/InviteCustomerDialog";
import { useAdminContext, useAdminOnboardingCases } from "@/features/admin/hooks/useAdmin";

export const Route = createFileRoute("/admin/onboarding-cases")({
  head: () => ({
    meta: [
      { title: "Dossiers d’ouverture — Back-office RFC" },
      { name: "description", content: "Suivi administratif des dossiers d’ouverture de compte RFC." },
      { property: "og:title", content: "Dossiers d’ouverture — RFC FINANCE Bank" },
      { property: "og:description", content: "Suivi sécurisé des vérifications d’identité et documents reçus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminOnboardingCasesPage,
});

function AdminOnboardingCasesPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const staff = useAdminContext();
  const query = useAdminOnboardingCases(search);
  const filtered = useMemo(() => status === "ALL" ? query.data ?? [] : (query.data ?? []).filter((item) => item.verificationStatus === status), [query.data, status]);
  return (
    <AdminGate permission="customers.read">
      <PageHeader title={en ? "Account applications" : "Dossiers d’ouverture"} description={en ? "Invite customers, review submitted files and complete the two-person approval." : "Invitez les clients, examinez les dossiers transmis et terminez la validation à deux personnes."} action={staff.data?.permissions.includes("customers.invite") ? <InviteCustomerDialog /> : undefined} />
      <div className="mb-5 grid gap-3 rounded-md border border-border bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_15rem]">
        <Input aria-label={en ? "Search applications" : "Rechercher un dossier"} placeholder={en ? "Name, email or customer reference" : "Nom, e-mail ou référence client"} value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="min-h-11" aria-label={en ? "Filter by status" : "Filtrer par statut"}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{en ? "All statuses" : "Tous les statuts"}</SelectItem><SelectItem value="NOT_STARTED">{en ? "Not started" : "Non commencé"}</SelectItem><SelectItem value="IN_PROGRESS">{en ? "In progress" : "En cours"}</SelectItem><SelectItem value="SUBMITTED">{en ? "Submitted" : "Dossier transmis"}</SelectItem><SelectItem value="UNDER_REVIEW">{en ? "Awaiting supervisor" : "Validation superviseur"}</SelectItem><SelectItem value="ADDITIONAL_INFORMATION_REQUIRED">{en ? "More information required" : "Complément requis"}</SelectItem><SelectItem value="VERIFIED">{en ? "Limited account opened" : "Compte limité ouvert"}</SelectItem><SelectItem value="REJECTED">{en ? "Rejected" : "Refusé"}</SelectItem></SelectContent></Select>
      </div>
      {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !filtered.length ? <div className="space-y-3"><EmptyState title={search.trim() || status !== "ALL" ? (en ? "No application matches these filters" : "Aucun dossier ne correspond à ces filtres") : (en ? "No application found" : "Aucun dossier trouvé")} />{search.trim() || status !== "ALL" ? <div className="flex justify-center"><Button variant="ghost" onClick={() => { setSearch(""); setStatus("ALL"); }}>{en ? "Clear filters" : "Réinitialiser les filtres"}</Button></div> : null}</div> : <AdminOnboardingCases cases={filtered} />}
      </PageSection>
    </AdminGate>
  );
}