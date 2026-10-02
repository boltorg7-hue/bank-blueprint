import { useState } from "react";
import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminAccountDto } from "@/features/admin/types/admin";
import { formatMoneyFromMinor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useAdminContext, useSetAccountStatus } from "@/features/admin/hooks/useAdmin";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function statusTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "PENDING") return "pending" as const;
  return "failed" as const;
}

export function AdminAccountsTable({ accounts }: { accounts: AdminAccountDto[] }) {
  const { language } = useLanguage();
  const en = language === "en";
  const context = useAdminContext();
  const mutation = useSetAccountStatus();
  const canManage = context.data?.permissions.includes("accounts.manage") ?? false;
  const [decision, setDecision] = useState<{ account: AdminAccountDto; status: "ACTIVE" | "FROZEN" } | null>(null);
  const [reason, setReason] = useState("");
  const reasonValid = reason.trim().length >= 8;

  async function confirmChange() {
    if (!decision || !reasonValid) return;
    try {
      await mutation.mutateAsync({ accountReference: decision.account.reference, status: decision.status, reason: reason.trim() });
      toast.success(en ? "Account status updated." : "Statut du compte mis à jour.");
      setDecision(null);
      setReason("");
    } catch {
      toast.error(en ? "Account status could not be changed." : "Le statut du compte n’a pas pu être modifié.");
    }
  }

  const actionFor = (account: AdminAccountDto) => {
    if (!canManage || !["ACTIVE", "FROZEN"].includes(account.status)) return null;
    const status = account.status === "ACTIVE" ? "FROZEN" : "ACTIVE";
    return (
      <Button className="w-full md:w-auto" size="sm" variant="outline" onClick={() => setDecision({ account, status })}>
        {status === "FROZEN" ? (en ? "Freeze" : "Geler") : (en ? "Reactivate" : "Réactiver")}
      </Button>
    );
  };

  const balance = (value: number, currency: string, minorUnit: number) =>
    formatMoneyFromMinor(value, { currency, minorUnitScale: 10 ** minorUnit });

  return (
    <>
      <ul className="native-list divide-y divide-border md:hidden">
        {accounts.map((account) => (
          <li key={account.id} className="space-y-4 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{account.displayName}</p>
                <p className="text-caption mt-1 text-muted-foreground">{account.reference} · {account.maskedNumber}</p>
              </div>
              <StatusBadge label={account.status} tone={statusTone(account.status)} />
            </div>
            <div>
              <p className="text-caption text-muted-foreground">{en ? "Account holder" : "Titulaire"}</p>
              <p className="text-body-sm mt-1 text-foreground">{account.holderName}</p>
              <p className="text-caption mt-1 text-muted-foreground">{account.holderReference}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3 rounded-md bg-surface-sunken p-3">
              <div><dt className="text-caption text-muted-foreground">{en ? "Available" : "Disponible"}</dt><dd className="text-numeric mt-1 text-sm font-semibold">{balance(account.availableBalanceMinor, account.currency, account.minorUnit)}</dd></div>
              <div><dt className="text-caption text-muted-foreground">{en ? "Reserved" : "Réservé"}</dt><dd className="text-numeric mt-1 text-sm">{balance(account.heldBalanceMinor, account.currency, account.minorUnit)}</dd></div>
            </dl>
            {actionFor(account)}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-md border border-border bg-surface md:block">
        <Table>
          <TableHeader><TableRow>
            <TableHead>{en ? "Account" : "Compte"}</TableHead>
            <TableHead>{en ? "Account holder" : "Titulaire"}</TableHead>
            <TableHead>{en ? "Status" : "Statut"}</TableHead>
            <TableHead>{en ? "Ledger balance" : "Solde comptable"}</TableHead>
            <TableHead>{en ? "Available" : "Disponible"}</TableHead>
            <TableHead>{en ? "Reserved" : "Réservé"}</TableHead>
            {canManage ? <TableHead>{en ? "Action" : "Action"}</TableHead> : null}
          </TableRow></TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell><p className="font-medium">{account.displayName}</p><p className="text-xs text-muted-foreground">{account.reference} · {account.maskedNumber}</p></TableCell>
                <TableCell><p>{account.holderName}</p><p className="text-xs text-muted-foreground">{account.holderReference}</p></TableCell>
                <TableCell><StatusBadge label={account.status} tone={statusTone(account.status)} /></TableCell>
                <TableCell>{balance(account.ledgerBalanceMinor, account.currency, account.minorUnit)}</TableCell>
                <TableCell>{balance(account.availableBalanceMinor, account.currency, account.minorUnit)}</TableCell>
                <TableCell>{balance(account.heldBalanceMinor, account.currency, account.minorUnit)}</TableCell>
                {canManage ? <TableCell>{actionFor(account)}</TableCell> : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(decision)} onOpenChange={(open) => { if (!open) { setDecision(null); setReason(""); } }}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-md">
          <DialogHeader>
            <DialogTitle>{decision?.status === "FROZEN" ? (en ? "Freeze account" : "Geler le compte") : (en ? "Reactivate account" : "Réactiver le compte")}</DialogTitle>
            <DialogDescription>{en ? "A reason of at least 8 characters is required and the action is audited server-side." : "Un motif d’au moins 8 caractères est requis et l’action est tracée côté serveur."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="account-decision-reason">{en ? "Reason" : "Motif"}</Label>
            <Textarea id="account-decision-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={8} autoFocus aria-invalid={reason.length > 0 && !reasonValid} />
            {reason.length > 0 ? (
              <p className={`flex items-center gap-1.5 text-xs ${reasonValid ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {reasonValid ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <XCircle className="size-3.5" aria-hidden="true" />}
                {reasonValid ? (en ? "Valid reason." : "Motif valide.") : (en ? "At least 8 characters." : "Au moins 8 caractères.")}
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CircleAlert className="size-3.5" aria-hidden="true" />{en ? "Required for audit." : "Requis pour la traçabilité."}</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDecision(null)}>{en ? "Cancel" : "Annuler"}</Button>
            <Button onClick={() => void confirmChange()} disabled={!reasonValid || mutation.isPending} loading={mutation.isPending}>{en ? "Confirm" : "Confirmer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
