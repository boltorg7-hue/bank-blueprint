import { useLanguage } from "@/components/providers/LanguageProvider";
import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
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
  const [touched, setTouched] = useState({ account: false, amount: false, reason: false });
  const permissions = context.data?.permissions ?? [];
  const canCreate = permissions.includes("finance.adjustment.create");
  const canApprove = permissions.includes("finance.adjustment.approve");
  const activeAccounts = useMemo(() => (accounts.data ?? []).filter((account) => account.status === "ACTIVE"), [accounts.data]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched({ account: true, amount: true, reason: true });
    const decimalPattern = /^\\d+(?:[.,]\\d{1,2})?$/;
    const decimal = Number(amount.replace(",", "."));
    if (!accountReference || !decimalPattern.test(amount.trim()) || !Number.isFinite(decimal) || decimal <= 0 || reason.trim().length < 8) {
      toast.error((en ? "Check the account, amount and reason (at least 8 characters)." : "Vérifiez le compte, le montant et le motif (8 caractères minimum)."));
      return;
    }
    try {
      await create.mutateAsync({ accountReference, amountMinor: Math.round(decimal * 100), reason: reason.trim(), idempotencyKey: crypto.randomUUID() });
      setAmount(""); setReason(""); setTouched({ account: false, amount: false, reason: false });
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

  if (accounts.isPending || requests.isPending) return <LoadingState label={en ? "Loading funding requests…" : "Chargement des approvisionnements…"} />;
  if (accounts.isError || requests.isError) return <ErrorState onRetry={() => { void accounts.refetch(); void requests.refetch(); }} />;

  return <div className="space-y-6">
    {canCreate ? <Card>
      <CardHeader><CardTitle>{(en ? "New request" : "Nouvelle demande")}</CardTitle><CardDescription>{(en ? "Funds will be posted only after approval by another authorized staff member." : "Le crédit ne sera comptabilisé qu’après validation par un autre membre autorisé.")}</CardDescription></CardHeader>
      <CardContent><form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>{en ? "Active account" : "Compte actif"}</Label>
          <Select value={accountReference} onValueChange={(value) => { setAccountReference(value); setTouched((current) => ({ ...current, account: true })); }}>
            <SelectTrigger aria-invalid={touched.account && !accountReference || undefined}><SelectValue placeholder={en ? "Select an account" : "Sélectionner un compte"} /></SelectTrigger>
            <SelectContent>{activeAccounts.map((account) => <SelectItem key={account.id} value={account.reference}>{account.holderName} · {account.reference}</SelectItem>)}</SelectContent>
          </Select>
          {touched.account ? <FieldHint valid={Boolean(accountReference)} text={en ? "Select an active customer account." : "Sélectionnez un compte client actif."} /> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="funding-amount">{en ? "Amount" : "Montant"}</Label>
          <Input id="funding-amount" inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setTouched((current) => ({ ...current, amount: true })); }} placeholder="1000,00" aria-invalid={touched.amount && (!/^\\d+(?:[.,]\\d{1,2})?$/.test(amount.trim()) || Number(amount.replace(",", ".")) <= 0) || undefined} />
          {touched.amount ? <FieldHint valid={/^\\d+(?:[.,]\\d{1,2})?$/.test(amount.trim()) && Number(amount.replace(",", ".")) > 0} text={en ? "Use a positive amount with up to 2 decimals." : "Utilisez un montant positif avec au plus 2 décimales."} /> : null}
        </div>
        <div className="space-y-2 lg:col-span-3">
          <Label htmlFor="funding-reason">{en ? "Operational reason" : "Motif opérationnel"}</Label>
          <Textarea id="funding-reason" value={reason} onChange={(event) => { setReason(event.target.value); setTouched((current) => ({ ...current, reason: true })); }} maxLength={500} placeholder={en ? "Auditable reason for funding" : "Motif traçable de l’approvisionnement"} aria-invalid={touched.reason && reason.trim().length < 8 || undefined} />
          {touched.reason ? <FieldHint valid={reason.trim().length >= 8} text={en ? "At least 8 characters are required for an auditable reason." : "Au moins 8 caractères sont requis pour un motif traçable."} /> : null}
        </div>
        <div>{!activeAccounts.length ? <p className="mb-2 text-xs text-muted-foreground">{en ? "No active account is currently available for funding." : "Aucun compte actif n’est actuellement disponible pour un approvisionnement."}</p> : null}<Button type="submit" disabled={!accountReference || !activeAccounts.length || create.isPending}>{create.isPending ? (en ? "Creating…" : "Création…") : (en ? "Create request" : "Créer la demande")}</Button></div>
      </form></CardContent>
    </Card> : null}

    {!(requests.data ?? []).length ? <EmptyState title={en ? "No funding request" : "Aucune demande d’approvisionnement"} /> : null}\n    {(requests.data ?? []).length ? <>{(requests.data ?? []).length ? <>\n    {(requests.data ?? []).length ? <>
    <ul className="native-list divide-y divide-border md:hidden">{(requests.data ?? []).map((request) => <li key={request.id} className="space-y-4 p-4"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><div className="min-w-0"><p className="truncate font-semibold">{request.holderName}</p><p className="text-caption mt-1 text-muted-foreground">{request.accountReference}</p></div><StatusBadge label={request.status === "PENDING" ? (en ? "Pending" : "En attente") : request.status === "APPROVED" ? (en ? "Approved" : "Approuvé") : (en ? "Rejected" : "Refusé")} tone={request.status === "PENDING" ? "pending" : request.status === "APPROVED" ? "success" : "failed"} /></div><p className="text-amount text-foreground">{formatMoneyFromMinor(request.amountMinor, { currency: request.currency })}</p><div className="rounded-md bg-surface-sunken p-3"><p className="text-caption text-muted-foreground">{en ? "Reason" : "Motif"}</p><p className="text-body-sm mt-1">{request.reason}</p><p className="text-caption mt-2 text-muted-foreground">Maker · {request.makerName}</p></div>{request.status === "PENDING" && canApprove ? <div className="grid grid-cols-2 gap-3"><Button onClick={() => void makeDecision(request.id, true)} disabled={decide.isPending}>{en ? "Approve" : "Approuver"}</Button><Button variant="outline" onClick={() => void makeDecision(request.id, false)} disabled={decide.isPending}>{en ? "Reject" : "Refuser"}</Button></div> : request.checkerName ? <p className="text-caption text-muted-foreground">Checker · {request.checkerName}</p> : null}</li>)}</ul>
    <div className="hidden overflow-hidden rounded-md border border-border bg-surface md:block"><Table>
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
    </> : <EmptyState title={en ? "No funding request" : "Aucune demande d’approvisionnement"} />}
  </div>;
}
