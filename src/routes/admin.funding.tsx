import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";


import { PageHeader } from "@/components/layout/PageHeader";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { FundingConsole } from "@/features/admin/components/FundingConsole";

export const Route = createFileRoute("/admin/funding")({ component: AdminFundingPage, head: () => ({ meta: [{ title: "Approvisionnements — Back-office" }, { name: "robots", content: "noindex, nofollow" }] }) });
function AdminFundingPage() {
  const { language } = useLanguage();
  const en = language === "en";
  return <AdminGate><PageHeader title={en ? "Funding requests" : "Approvisionnements"} description={en ? "Funding requests requiring two separate approvers and double-entry posting." : "Demandes de crédit soumises à la séparation maker-checker et comptabilisées en partie double."} /><FundingConsole /></AdminGate>;
}
