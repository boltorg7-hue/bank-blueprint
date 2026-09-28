import { useLanguage } from "@/components/providers/LanguageProvider";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminCustomerDto } from "@/features/admin/types/admin";
import { LIFECYCLE_LABELS } from "@/types/customer-lifecycle";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useAdminContext, useSetCustomerState } from "@/features/admin/hooks/useAdmin";
import { toast } from "sonner";

export function AdminCustomersTable({ customers }: { customers: AdminCustomerDto[] }) {
  const { language } = useLanguage();
  const en = language === "en";
  const context = useAdminContext(); const mutation = useSetCustomerState();
  const canManage = context.data?.permissions.includes("customers.write") ?? false;
  async function change(customer: AdminCustomerDto, state: "ACTIVE" | "RESTRICTED" | "SUSPENDED") {
    const reason = window.prompt((en ? "Reason for this change (at least 8 characters):" : "Motif obligatoire de cette modification (8 caractères minimum) :"))?.trim() ?? "";
    if (reason.length < 8) return;
    try { await mutation.mutateAsync({ customerId: customer.id, state, reason }); toast.success((en ? "Customer status updated." : "Statut client mis à jour.")); }
    catch { toast.error((en ? "Customer status could not be changed." : "Le statut client n’a pas pu être modifié.")); }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <Table>
        <TableHeader><TableRow>
          <TableHead>{en ? "Customer" : (en ? "Customer" : "Client")}</TableHead><TableHead>{en ? (en ? "Contact" : "Contact") : (en ? "Contact" : "Contact")}</TableHead><TableHead>{en ? "Status" : (en ? "Status" : "Statut")}</TableHead><TableHead>{en ? "Accounts" : (en ? "Accounts" : "Comptes")}</TableHead><TableHead>{en ? "Registered" : (en ? "Registered" : "Inscription")}</TableHead>{canManage ? <TableHead>{en ? (en ? "Action" : "Action") : (en ? "Action" : "Action")}</TableHead> : null}
        </TableRow></TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell><p className="font-medium">{customer.fullName}</p><p className="text-xs text-muted-foreground">{customer.reference}</p></TableCell>
              <TableCell><p>{customer.email ?? (en ? "No email provided" : "E-mail non renseigné")}</p><p className="text-xs text-muted-foreground">{customer.phone ?? (en ? "No phone provided" : "Téléphone non renseigné")}</p></TableCell>
              <TableCell><StatusBadge label={LIFECYCLE_LABELS[customer.lifecycleState]} tone={customer.lifecycleState === "ACTIVE" ? "success" : customer.lifecycleState === "SUSPENDED" || customer.lifecycleState === "CLOSED" ? "failed" : "pending"} /></TableCell>
              <TableCell>{customer.accountCount}</TableCell>
              <TableCell>{formatDate(customer.createdAt)}</TableCell>
              {canManage ? <TableCell><div className="flex gap-2">{customer.lifecycleState === "ACTIVE" ? <Button size="sm" variant="outline" onClick={() => void change(customer, "RESTRICTED")}>{en ? "Restrict" : (en ? "Restrict" : "Restreindre")}</Button> : <Button size="sm" variant="outline" onClick={() => void change(customer, "ACTIVE")}>{en ? "Reactivate" : (en ? "Reactivate" : "Réactiver")}</Button>}<Button size="sm" variant="ghost" onClick={() => void change(customer, "SUSPENDED")}>{en ? "Suspend" : (en ? "Suspend" : "Suspendre")}</Button></div></TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
