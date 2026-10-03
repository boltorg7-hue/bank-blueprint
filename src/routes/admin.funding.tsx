import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";


import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { AdminGate } from "@/features/admin/components/AdminGate";
const FundingConsole = lazy(() => import("@/features/admin/components/FundingConsole").then((module) => ({ default: module.FundingConsole })));

export const Route = createFileRoute("/admin/funding")({ component: AdminFundingPage, head: () => ({ meta: [{ title: "Approvisionnements — Back-office" }, { name: "robots", content: "noindex, nofollow" }] }) });
function AdminFundingPage() {
  const { language } = useLanguage();
  const en = language === "en";
  return <AdminGate><PageHeader title={en ? "Funding requests" : "Approvisionnements"} description={en ? "Funding requests requiring two separate approvers and double-entry posting." : "Demandes de crédit soumises à la séparation maker-checker et comptabilisées en partie double."} /><PageSection><Suspense fallback={<LoadingState />}><FundingConsole /></Suspense></PageSection></AdminGate>;
}
