import { useLanguage } from "@/components/providers/LanguageProvider";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminAccountDto } from "@/features/admin/types/admin";
import { formatMoneyFromMinor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useAdminContext, useSetAccountStatus } from "@/features/admin/hooks/useAdmin";
import { toast } from "sonner";

export function AdminAccountsTable({ accounts }: { accounts: AdminAccountDto[] }) {
  const { language } = useLanguage();
  const en = language === "en";
  const context = useAdminContext(); const mutation = useSetAccountStatus();
  const canManage = context.data?.permissions.includes("accounts.manage") ?? false;
  async function change(account: AdminAccountDto, status: "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "FROZEN") {
    const reason = window.prompt((en ? "Reason for this change (at least 8 characters):" : "Motif obligatoire de cette modification (8 caractères minimum) :"))?.trim() ?? "";
    if (reason.length < 8) return;
    try { await mutation.mutateAsync({ accountReference: account.reference, status, reason }); toast.success((en ? "Account status updated." : "Statut du compte mis à jour.")); }
    catch { toast.error((en ? "Account status could not be changed." : "Le statut du compte n’a pas pu être modifié.")); }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <Table>
        <TableHeader><TableRow>
          <TableHead>{en ? "Account" : (en ? "Account" : "Compte")}</TableHead><TableHead>{en ? "Account holder" : (en ? "Account holder" : "Titulaire")}</TableHead><TableHead>{en ? "Status" : (en ? "Status" : "Statut")}</TableHead><TableHead>{en ? "Ledger balance" : (en ? "Ledger balance" : "Solde comptable")}</TableHead><TableHead>{en ? "Available" : (en ? "Available" : "Disponible")}</TableHead><TableHead>{en ? "Reserved" : (en ? "Reserved" : "Réservé")}</TableHead>{canManage ? <TableHead>{en ? (en ? "Action" : "Action") : (en ? "Action" : "Action")}</TableHead> : null}
        </TableRow></TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell><p className="font-medium">{account.displayName}</p><p className="text-xs text-muted-foreground">{account.reference} · {account.maskedNumber}</p></TableCell>
              <TableCell><p>{account.holderName}</p><p className="text-xs text-muted-foreground">{account.holderReference}</p></TableCell>
              <TableCell><StatusBadge label={account.status} tone={account.status === "ACTIVE" ? "success" : account.status === "PENDING" ? "pending" : "failed"} /></TableCell>
              <TableCell>{formatMoneyFromMinor(account.ledgerBalanceMinor, { currency: account.currency, minorUnitScale: 10 ** account.minorUnit })}</TableCell>
              <TableCell>{formatMoneyFromMinor(account.availableBalanceMinor, { currency: account.currency, minorUnitScale: 10 ** account.minorUnit })}</TableCell>
              <TableCell>{formatMoneyFromMinor(account.heldBalanceMinor, { currency: account.currency, minorUnitScale: 10 ** account.minorUnit })}</TableCell>
              {canManage ? <TableCell>{account.status === "ACTIVE" ? <Button size="sm" variant="outline" onClick={() => void change(account, "FROZEN")}>{en ? "Freeze" : (en ? "Freeze" : "Geler")}</Button> : <Button size="sm" variant="outline" onClick={() => void change(account, "ACTIVE")}>{en ? "Reactivate" : (en ? "Reactivate" : "Réactiver")}</Button>}</TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
