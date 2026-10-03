import { useState } from "react";
import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminCustomerDto } from "@/features/admin/types/admin";
import { LIFECYCLE_LABELS } from "@/types/customer-lifecycle";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useAdminContext, useSetCustomerState } from "@/features/admin/hooks/useAdmin";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminCustomerOperationalDossier } from "@/features/admin/components/AdminCustomerOperationalDossier";

export function AdminCustomersTable({ customers }: { customers: AdminCustomerDto[] }) {
  const { language } = useLanguage();
  const en = language === "en";
  const context = useAdminContext(); const mutation = useSetCustomerState();
  const canManage = context.data?.permissions.includes("customers.write") ?? false;
  const [decision, setDecision] = useState<{ customer: AdminCustomerDto; state: "ACTIVE" | "RESTRICTED" | "SUSPENDED" } | null>(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState<AdminCustomerDto | null>(null);
  async function confirmChange() {
    if (!decision || reason.trim().length < 8 || decision.state === decision.customer.lifecycleState) return;
    try { await mutation.mutateAsync({ customerId: decision.customer.id, state: decision.state, reason: reason.trim() }); toast.success(en ? "Customer status updated." : "Statut client mis à jour."); setDecision(null); setReason(""); }
    catch { toast.error((en ? "Customer status could not be changed." : "Le statut client n’a pas pu être modifié.")); }
  }
  const actionsFor = (customer: AdminCustomerDto) => {
    if (!canManage || !["ACTIVE", "RESTRICTED", "SUSPENDED"].includes(customer.lifecycleState)) return null;
    return <div className="grid grid-cols-2 gap-3 md:flex">{customer.lifecycleState === "ACTIVE" ? <Button size="sm" variant="outline" onClick={() => setDecision({ customer, state: "RESTRICTED" })}>{en ? "Restrict" : "Restreindre"}</Button> : <Button size="sm" variant="outline" onClick={() => setDecision({ customer, state: "ACTIVE" })}>{en ? "Reactivate" : "Réactiver"}</Button>}<Button size="sm" variant="ghost" onClick={() => setDecision({ customer, state: "SUSPENDED" })} disabled={customer.lifecycleState === "SUSPENDED"}>{en ? "Suspend" : "Suspendre"}</Button></div>;
  };
  return (
    <>
    <ul className="native-list divide-y divide-border md:hidden">{customers.map((customer) => <li key={customer.id} className="space-y-4 p-4"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><div className="min-w-0"><p className="truncate font-semibold text-foreground">{customer.fullName}</p><p className="text-caption mt-1 text-muted-foreground">{customer.reference}</p></div><StatusBadge label={LIFECYCLE_LABELS[customer.lifecycleState]} tone={customer.lifecycleState === "ACTIVE" ? "success" : customer.lifecycleState === "SUSPENDED" || customer.lifecycleState === "CLOSED" ? "failed" : "pending"} /></div><div className="space-y-1 text-body-sm"><p className="break-all text-foreground">{customer.email ?? (en ? "No email provided" : "E-mail non renseigné")}</p><p className="text-muted-foreground">{customer.phone ?? (en ? "No phone provided" : "Téléphone non renseigné")}</p></div><dl className="grid grid-cols-2 gap-3 rounded-md bg-surface-sunken p-3"><div><dt className="text-caption text-muted-foreground">{en ? "Accounts" : "Comptes"}</dt><dd className="mt-1 font-semibold">{customer.accountCount}</dd></div><div><dt className="text-caption text-muted-foreground">{en ? "Registered" : "Inscription"}</dt><dd className="mt-1 text-sm">{formatDate(customer.createdAt)}</dd></div></dl><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => setDetails(customer)}>{en ? "Open dossier" : "Ouvrir le dossier"}</Button>{canManage ? actionsFor(customer) : null}</div></li>)}</ul>
    <div className="hidden overflow-hidden rounded-md border border-border bg-surface md:block">
      <Table>
        <TableHeader><TableRow>
          <TableHead>{en ? "Customer" : "Client"}</TableHead><TableHead>{en ? "Attention" : "Action requise"}</TableHead><TableHead>Contact</TableHead><TableHead>{en ? "Status" : "Statut"}</TableHead><TableHead>{en ? "Accounts" : "Comptes"}</TableHead><TableHead>{en ? "Registered" : "Inscription"}</TableHead>{canManage ? <TableHead>Action</TableHead> : null}
        </TableRow></TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell><p className="font-medium">{customer.fullName}</p><p className="text-xs text-muted-foreground">{customer.reference}</p></TableCell>
              <TableCell>{customer.attentionCount > 0 ? <div className="flex items-center gap-2 text-sm font-medium"><CircleAlert className="size-4 text-warning" aria-hidden="true" />{customer.attentionCount}</div> : <span className="text-sm text-muted-foreground">—</span>}</TableCell><TableCell><p>{customer.email ?? (en ? "No email provided" : "E-mail non renseigné")}</p><p className="text-xs text-muted-foreground">{customer.phone ?? (en ? "No phone provided" : "Téléphone non renseigné")}</p></TableCell>
              <TableCell><StatusBadge label={LIFECYCLE_LABELS[customer.lifecycleState]} tone={customer.lifecycleState === "ACTIVE" ? "success" : customer.lifecycleState === "SUSPENDED" || customer.lifecycleState === "CLOSED" ? "failed" : "pending"} /></TableCell>
              <TableCell>{customer.accountCount}</TableCell>
              <TableCell>{formatDate(customer.createdAt)}</TableCell>
              <TableCell><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => setDetails(customer)}>{en ? "Open dossier" : "Ouvrir le dossier"}</Button>{canManage ? actionsFor(customer) : null}</div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    <Dialog open={Boolean(decision)} onOpenChange={(open) => { if (!open) { setDecision(null); setReason(""); } }}><DialogContent className="w-[calc(100%-2rem)] rounded-md"><DialogHeader><DialogTitle>{en ? "Confirm customer status" : "Confirmer le statut client"}</DialogTitle><DialogDescription>{en ? "Record an auditable reason before confirming this sensitive action." : "Consignez un motif traçable avant de confirmer cette action sensible."}</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="customer-decision-reason">{en ? "Reason" : "Motif"}</Label><Textarea id="customer-decision-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={8} autoFocus aria-invalid={reason.length > 0 && reason.trim().length < 8} />
        {reason.length > 0 ? <p className={reason.trim().length >= 8 ? "flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400" : "flex items-center gap-1.5 text-xs text-destructive"}>{reason.trim().length >= 8 ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <XCircle className="size-3.5" aria-hidden="true" />}{reason.trim().length >= 8 ? (en ? "Valid reason." : "Motif valide.") : (en ? "At least 8 characters." : "Au moins 8 caractères.")}</p> : <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CircleAlert className="size-3.5" aria-hidden="true" />{en ? "Required for audit." : "Requis pour la traçabilité."}</p>}</div><DialogFooter className="gap-2"><Button variant="outline" onClick={() => setDecision(null)}>{en ? "Cancel" : "Annuler"}</Button><Button onClick={() => void confirmChange()} disabled={reason.trim().length < 8 || mutation.isPending} loading={mutation.isPending}>{en ? "Confirm" : "Confirmer"}</Button></DialogFooter></DialogContent></Dialog>
    <AdminCustomerOperationalDossier customer={details} open={Boolean(details)} onOpenChange={(open) => { if (!open) setDetails(null); }} />
    </>
  );
}
