import { useState } from "react";
import { AdminCustomerOperationalDossier } from "@/features/admin/components/AdminCustomerOperationalDossier";
import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminAccountDto } from "@/features/admin/types/admin";
import { formatMoneyFromMinor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useAdminContext, useSetAccountStatus, useAdminAccountStatusHistory } from "@/features/admin/hooks/useAdmin";
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
  const [details, setDetails] = useState<AdminAccountDto | null>(null);
  const [dossierCustomer, setDossierCustomer] = useState<import("@/features/admin/types/admin").AdminCustomerDto | null>(null);
  const history = useAdminAccountStatusHistory(details?.reference ?? null);
  const openDossier = (account: AdminAccountDto) => setDossierCustomer({ id: account.holderId, reference: account.holderReference, fullName: account.holderName, email: null, phone: null, lifecycleState: "ACTIVE", accountCount: 1, createdAt: new Date().toISOString(), attentionCount: 0, attentionReasons: [], oldestAttentionAt: null });
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
      <Button className="w-auto" size="sm" variant="outline" onClick={() => setDecision({ account, status })}>
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
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => setDetails(account)}>{en ? "View account" : "Voir le compte"}</Button><Button size="sm" variant="ghost" onClick={() => openDossier(account)}>{en ? "Open dossier" : "Ouvrir le dossier"}</Button>{actionFor(account)}</div>
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
            <TableHead>{en ? "Action" : "Action"}</TableHead>
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
                <TableCell><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => openDossier(account)}>{en ? "Dossier" : "Dossier"}</Button><Button size="sm" variant="ghost" onClick={() => setDetails(account)}>{en ? "View" : "Voir"}</Button>{actionFor(account)}</div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(details)} onOpenChange={(open) => { if (!open) setDetails(null); }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-md">
          <DialogHeader>
            <DialogTitle>{en ? "Account operational details" : "Détails opérationnels du compte"}</DialogTitle>
            <DialogDescription>{details?.reference}</DialogDescription>
          </DialogHeader>
          {details ? <div className="space-y-5">
            <div className="rounded-md bg-surface-sunken p-4">
              <p className="font-semibold">{details.displayName}</p>
              <p className="text-sm text-muted-foreground">{details.holderName} · {details.holderReference}</p>
              <div className="mt-3 flex flex-wrap gap-2"><StatusBadge label={details.status} tone={statusTone(details.status)} /><span className="rounded-full border border-border px-2 py-1 text-xs">{details.currency}</span><span className="rounded-full border border-border px-2 py-1 text-xs">{details.maskedNumber}</span></div>
            </div>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border p-3"><dt className="text-caption text-muted-foreground">{en ? "Ledger balance" : "Solde comptable"}</dt><dd className="text-numeric mt-1 font-semibold">{balance(details.ledgerBalanceMinor, details.currency, details.minorUnit)}</dd></div>
              <div className="rounded-md border border-border p-3"><dt className="text-caption text-muted-foreground">{en ? "Available" : "Disponible"}</dt><dd className="text-numeric mt-1 font-semibold">{balance(details.availableBalanceMinor, details.currency, details.minorUnit)}</dd></div>
              <div className="rounded-md border border-border p-3"><dt className="text-caption text-muted-foreground">{en ? "Reserved" : "Réservé"}</dt><dd className="text-numeric mt-1 font-semibold">{balance(details.heldBalanceMinor, details.currency, details.minorUnit)}</dd></div>
            </dl>
            <p className="text-xs text-muted-foreground">{en ? "Balances are read-only projections from the ledger. Financial adjustments remain restricted to the funding workflow." : "Les soldes sont des projections en lecture seule du ledger. Les ajustements financiers restent limités au workflow de financement."}</p>
            <div className="space-y-3">
              <div>
                <p className="font-semibold">{en ? "Status history" : "Historique des statuts"}</p>
                <p className="text-xs text-muted-foreground">{en ? "Read-only operational history." : "Historique opérationnel en lecture seule."}</p>
              </div>
              {history.isLoading ? <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">{en ? "Loading history…" : "Chargement de l’historique…"}</div> : null}
              {history.isError ? <div className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">{en ? "History unavailable." : "Historique indisponible."}</div> : null}
              {!history.isLoading && !history.isError && history.data?.length === 0 ? <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">{en ? "No status change recorded." : "Aucun changement de statut enregistré."}</div> : null}
              <ul className="space-y-2">
                {(history.data ?? []).map((item) => (
                  <li key={item.id} className="rounded-md border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{item.previousStatus} → {item.newStatus}</p>
                      <time className="text-xs text-muted-foreground">{new Date(item.changedAt).toLocaleString(en ? "en-GB" : "fr-FR")}</time>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.changedByName}{item.changedByReference ? ` · ${item.changedByReference}` : ""} · {item.reasonCategory}</p>
                    {item.internalNote ? <p className="mt-2 text-sm">{item.internalNote}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div> : null}
          <DialogFooter><Button variant="outline" onClick={() => setDetails(null)}>{en ? "Close" : "Fermer"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
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
      <AdminCustomerOperationalDossier customer={dossierCustomer} open={Boolean(dossierCustomer)} onOpenChange={(open) => { if (!open) setDossierCustomer(null); }} />
    </>
  );
}
