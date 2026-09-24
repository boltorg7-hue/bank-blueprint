import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/PageHeader";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { AdminSupportConsole } from "@/features/support/components/AdminSupportConsole";

export const Route=createFileRoute("/admin/support")({component:AdminSupportPage,head:()=>({meta:[{title:"Service client — Back-office"},{name:"robots",content:"noindex, nofollow"}]})});
function AdminSupportPage(){return <AdminGate permission="support.read"><PageHeader title="Service client" description="Demandes sécurisées envoyées par les clients et réponses de l’équipe d’assistance."/><AdminSupportConsole/></AdminGate>;}
