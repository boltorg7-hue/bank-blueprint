import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminAccountDto } from "@/features/admin/types/admin";
import { formatMoneyFromMinor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useAdminContext, useSetAccountStatus } from "@/features/admin/hooks/useAdmin";
import { toast } from "sonner";

export function AdminAccountsTable({ accounts }: { accounts: AdminAccountDto[] }) {
  const context = useAdminContext(); const mutation = useSetAccountStatus();
  const canManage = context.data?.permissions.includes("accounts.manage") ?? false;
  async function change(account: AdminAccountDto, status: "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "FROZEN") {
    const reason = window.prompt("Motif obligatoire de cette modification (8 caractères minimum) :")?.trim() ?? "";
    if (reason.length < 8) return;
    try { await mutation.mutateAsync({ accountReference: account.reference, status, reason }); toast.success("Statut du compte mis à jour."); }
    catch { toast.error("Le statut du compte n’a pas pu être modifié."); }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Compte</TableHead><TableHead>Titulaire</TableHead><TableHead>Statut</TableHead><TableHead>Solde comptable</TableHead><TableHead>Disponible</TableHead><TableHead>Réservé</TableHead>{canManage ? <TableHead>Action</TableHead> : null}
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
              {canManage ? <TableCell>{account.status === "ACTIVE" ? <Button size="sm" variant="outline" onClick={() => void change(account, "FROZEN")}>Geler</Button> : <Button size="sm" variant="outline" onClick={() => void change(account, "ACTIVE")}>Réactiver</Button>}</TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
