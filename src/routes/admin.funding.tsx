import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/PageHeader";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { FundingConsole } from "@/features/admin/components/FundingConsole";

export const Route = createFileRoute("/admin/funding")({ component: AdminFundingPage, head: () => ({ meta: [{ title: "Approvisionnements — Back-office" }, { name: "robots", content: "noindex, nofollow" }] }) });
function AdminFundingPage() {
  return <AdminGate><PageHeader title="Approvisionnements" description="Demandes de crédit soumises à la séparation maker-checker et comptabilisées en partie double." /><FundingConsole /></AdminGate>;
}
