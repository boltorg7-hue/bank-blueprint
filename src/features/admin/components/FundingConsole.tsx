import { useLanguage } from "@/components/providers/LanguageProvider";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ErrorState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAccounts, useAdminContext, useCreateFundingRequest, useDecideFundingRequest, useFundingRequests } from "@/features/admin/hooks/useAdmin";
import { formatMoneyFromMinor } from "@/lib/format";

export function FundingConsole() {
  const { language } = useLanguage();
  const en = language === "en";
  const context = useAdminContext();
  const accounts = useAdminAccounts();
  const requests = useFundingRequests();
  const create = useCreateFundingRequest();
  const decide = useDecideFundingRequest();
  const [accountReference, setAccountReference] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const permissions = context.data?.permissions ?? [];
  const canCreate = permissions.includes("finance.adjustment.create");
  const canApprove = permissions.includes("finance.adjustment.approve");
  const activeAccounts = useMemo(() => (accounts.data ?? []).filter((account) => account.status === "ACTIVE"), [accounts.data]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const decimal = Number(amount.replace(",", "."));
    if (!Number.isFinite(decimal) || decimal <= 0 || reason.trim().length < 8) {
      toast.error((en ? "Check the account, amount and reason (at least 8 characters)." : "Vérifiez le compte, le montant et le motif (8 caractères minimum)."));
      return;
    }
    try {
      await create.mutateAsync({ accountReference, amountMinor: Math.round(decimal * 100), reason: reason.trim(), idempotencyKey: crypto.randomUUID() });
      setAmount(""); setReason("");
      toast.success((en ? "Request created. A different supervisor must approve it." : "Demande créée. Un superviseur distinct doit la valider."));
    } catch { toast.error((en ? "Funding request could not be created." : "La demande d’approvisionnement n’a pas pu être créée.")); }
  }

  async function makeDecision(requestId: string, approve: boolean) {
    try {
      await decide.mutateAsync({ requestId, approve });
      toast.success(approve ? (en ? "Funding approved and posted." : "Approvisionnement approuvé et comptabilisé.") : (en ? "Funding rejected." : "Approvisionnement refusé."));
    } catch (error) {
      toast.error(error instanceof Error && error.message.includes("MAKER") ? (en ? "The requester cannot approve their own request." : "Le créateur ne peut pas approuver sa propre demande.") : (en ? "Decision could not be saved." : "La décision n’a pas pu être enregistrée."));
    }
  }

  if (accounts.isPending || requests.isPending) return <LoadingState label=(en ? "Loading funding requests…" : "Chargement des approvisionnements…") />;
  if (accounts.isError || requests.isError) return <ErrorState onRetry={() => { void accounts.refetch(); void requests.refetch(); }} />;

  return <div className="space-y-6">
    {canCreate ? <Card>
      <CardHeader><CardTitle>{(en ? "New request" : "Nouvelle demande")}</CardTitle><CardDescription>{(en ? "Funds will be posted only after approval by another authorized staff member." : "Le crédit ne sera comptabilisé qu’après validation par un autre membre autorisé.")}</CardDescription></CardHeader>
      <CardContent><form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2"><Label>{(en ? "Active account" : "Compte actif")}</Label><Select value={accountReference} onValueChange={setAccountReference}><SelectTrigger><SelectValue placeholder=(en ? "Select an account" : "Sélectionner un compte") /></SelectTrigger><SelectContent>{activeAccounts.map((account) => <SelectItem key={account.id} value={account.reference}>{account.holderName} · {account.reference}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="funding-amount">{(en ? "Amount" : "Montant")}</Label><Input id="funding-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="1000,00" /></div>
        <div className="space-y-2 lg:col-span-3"><Label htmlFor="funding-reason">{(en ? "Operational reason" : "Motif opérationnel")}</Label><Textarea id="funding-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder=(en ? "Auditable reason for funding" : "Motif traçable de l’approvisionnement") /></div>
        <div><Button type="submit" disabled={!accountReference || create.isPending}>{create.isPending ? (en ? "Creating…" : "Création…") : (en ? "Create request" : "Créer la demande")}</Button></div>
      </form></CardContent>
    </Card> : null}

    <div className="overflow-hidden rounded-xl border border-border bg-surface"><Table>
      <TableHeader><TableRow><TableHead>{(en ? "Account" : "Compte")}</TableHead><TableHead>{(en ? "Amount" : "Montant")}</TableHead><TableHead>{(en ? "Reason" : "Motif")}</TableHead><TableHead>Maker</TableHead><TableHead>{(en ? "Status" : "Statut")}</TableHead><TableHead>{(en ? "Decision" : "Décision")}</TableHead></TableRow></TableHeader>
      <TableBody>{(requests.data ?? []).map((request) => <TableRow key={request.id}>
        <TableCell><p className="font-medium">{request.holderName}</p><p className="text-xs text-muted-foreground">{request.accountReference}</p></TableCell>
        <TableCell>{formatMoneyFromMinor(request.amountMinor, { currency: request.currency })}</TableCell>
        <TableCell className="max-w-xs">{request.reason}</TableCell>
        <TableCell>{request.makerName}</TableCell>
        <TableCell><StatusBadge label={request.status === "PENDING" ? (en ? "Pending" : "En attente") : request.status === "APPROVED" ? (en ? "Approved" : "Approuvé") : (en ? "Rejected" : "Refusé")} tone={request.status === "PENDING" ? "pending" : request.status === "APPROVED" ? "success" : "failed"} /></TableCell>
        <TableCell>{request.status === "PENDING" && canApprove ? <div className="flex gap-2"><Button size="sm" onClick={() => void makeDecision(request.id, true)} disabled={decide.isPending}>{(en ? "Approve" : "Approuver")}</Button><Button size="sm" variant="outline" onClick={() => void makeDecision(request.id, false)} disabled={decide.isPending}>{(en ? "Reject" : "Refuser")}</Button></div> : request.checkerName ?? "—"}</TableCell>
      </TableRow>)}</TableBody>
    </Table></div>
  </div>;
}
