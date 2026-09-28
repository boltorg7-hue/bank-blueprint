import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";


import { PageHeader } from "@/components/layout/PageHeader";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { AdminSupportConsole } from "@/features/support/components/AdminSupportConsole";

export const Route=createFileRoute("/admin/support")({component:AdminSupportPage,head:()=>({meta:[{title:"Service client — Back-office"},{name:"robots",content:"noindex, nofollow"}]})});
function AdminSupportPage(){
  const { language } = useLanguage();
  const en = language === "en";return <AdminGate permission="support.read"><PageHeader title={en ? "Customer support" : "Service client"} description={en ? "Secure requests from customers and responses from the support team." : "Demandes sécurisées envoyées par les clients et réponses de l’équipe d’assistance."}/><AdminSupportConsole/></AdminGate>;}
