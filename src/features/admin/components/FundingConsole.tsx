import { useState } from "react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminContext,
  useCreateFundingRequest,
  useDecideFundingRequest,
  useFundingAccountSearch,
  useFundingRequests,
} from "@/features/admin/hooks/useAdmin";
import { formatMoneyFromMinor } from "@/lib/format";

export function FundingConsole() {
  const { language } = useLanguage();
  const en = language === "en";
  const context = useAdminContext();
  const [fundingCursor, setFundingCursor] = useState<string | null>(null);
  const [fundingHistory, setFundingHistory] = useState<string[]>([]);
  const requests = useFundingRequests(fundingCursor);
  const create = useCreateFundingRequest();
  const decide = useDecideFundingRequest();
  const [accountSearch, setAccountSearch] = useState("");
  const [accountReference, setAccountReference] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState({ account: false, amount: false, reason: false });
  const accountLookup = useFundingAccountSearch(accountSearch);
  const permissions = context.data?.permissions ?? [];
  const canCreate = permissions.includes("finance.adjustment.create");
  const canApprove = permissions.includes("finance.adjustment.approve");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched({ account: true, amount: true, reason: true });
    const decimalPattern = /^\d+(?:[.,]\d{1,2})?$/;
    const decimal = Number(amount.replace(",", "."));
    if (!accountReference || !decimalPattern.test(amount.trim()) || !Number.isFinite(decimal) || decimal <= 0 || reason.trim().length < 8) {
      toast.error(en ? "Check the account, amount and reason (at least 8 characters)." : "Vérifiez le compte, le montant et le motif (8 caractères minimum).");
      return;
    }
    try {
      await create.mutateAsync({
        accountReference,
        amountMinor: Math.round(decimal * 100),
        reason: reason.trim(),
        idempotencyKey: crypto.randomUUID(),
      });
      setAmount("");
      setReason("");
      setTouched({ account: false, amount: false, reason: false });
      toast.success(en ? "Request created. A different supervisor must approve it." : "Demande créée. Un superviseur distinct doit la valider.");
    } catch {
      toast.error(en ? "Funding request could not be created." : "La demande d’approvisionnement n’a pas pu être créée.");
    }
  }

  async function makeDecision(requestId: string, approve: boolean) {
    try {
      await decide.mutateAsync({ requestId, approve });
      toast.success(
        approve
          ? (en ? "Funding approved and posted." : "Approvisionnement approuvé et comptabilisé.")
          : (en ? "Funding rejected." : "Approvisionnement refusé."),
      );
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.includes("MAKER")
          ? (en ? "The requester cannot approve their own request." : "Le créateur ne peut pas approuver sa propre demande.")
          : (en ? "Decision could not be saved." : "La décision n’a pas pu être enregistrée."),
      );
    }
  }

  function goNext() {
    if (!requests.data?.nextCursor) return;
    setFundingHistory((history) => [...history, fundingCursor ?? ""]);
    setFundingCursor(requests.data.nextCursor);
  }

  function goPrevious() {
    setFundingHistory((history) => {
      const next = [...history];
      setFundingCursor(next.pop() || null);
      return next;
    });
  }

  if (requests.isPending || context.isPending) {
    return <LoadingState label={en ? "Loading funding requests…" : "Chargement des approvisionnements…"} />;
  }
  if (requests.isError || context.isError) {
    return <ErrorState onRetry={() => { void requests.refetch(); void context.refetch(); }} />;
  }

  const accountOptions = accountLookup.data ?? [];
  const accountSearchReady = accountSearch.trim().length >= 2;

  return (
    <div className="space-y-6">
      {canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>{en ? "New request" : "Nouvelle demande"}</CardTitle>
            <CardDescription>
              {en
                ? "Funds will be posted only after approval by another authorized staff member."
                : "Le crédit ne sera comptabilisé qu’après validation par un autre membre autorisé."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="funding-account-search">{en ? "Active account" : "Compte actif"}</Label>
                <Input
                  id="funding-account-search"
                  value={accountSearch}
                  onChange={(event) => {
                    setAccountSearch(event.target.value);
                    setAccountReference("");
                    setTouched((current) => ({ ...current, account: true }));
                  }}
                  placeholder={en ? "Search by account reference or name" : "Rechercher par référence ou nom"}
                  aria-invalid={touched.account && !accountReference || undefined}
                />
                {accountSearchReady ? (
                  <div className="rounded-md border border-border bg-surface">
                    {accountLookup.isPending ? (
                      <p className="p-3 text-sm text-muted-foreground">{en ? "Searching…" : "Recherche…"}</p>
                    ) : accountLookup.isError ? (
                      <p className="p-3 text-sm text-destructive">{en ? "Account search unavailable." : "Recherche de compte indisponible."}</p>
                    ) : accountOptions.length ? (
                      <ul className="max-h-52 overflow-auto">
                        {accountOptions.map((account) => (
                          <li key={account.id}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-sunken"
                              onClick={() => {
                                setAccountReference(account.reference);
                                setAccountSearch(account.reference);
                                setTouched((current) => ({ ...current, account: true }));
                              }}
                            >
                              <span className="min-w-0 truncate">{account.holderName}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">{account.reference}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="p-3 text-sm text-muted-foreground">
                        {en ? "No active account found." : "Aucun compte actif trouvé."}
                      </p>
                    )}
                  </div>
                ) : null}
                {touched.account ? (
                  <p className={accountReference ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>
                    {accountReference
                      ? (en ? "Active account selected." : "Compte actif sélectionné.")
                      : (en ? "Select an active customer account." : "Sélectionnez un compte client actif.")}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="funding-amount">{en ? "Amount" : "Montant"}</Label>
                <Input
                  id="funding-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setTouched((current) => ({ ...current, amount: true }));
                  }}
                  placeholder="1000,00"
                  aria-invalid={
                    touched.amount &&
                    (!/^\d+(?:[.,]\d{1,2})?$/.test(amount.trim()) || Number(amount.replace(",", ".")) <= 0) || undefined
                  }
                />
                {touched.amount ? (
                  <p className="text-xs text-muted-foreground">
                    {en ? "Use a positive amount with up to 2 decimals." : "Utilisez un montant positif avec au plus 2 décimales."}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="funding-reason">{en ? "Operational reason" : "Motif opérationnel"}</Label>
                <Textarea
                  id="funding-reason"
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setTouched((current) => ({ ...current, reason: true }));
                  }}
                  maxLength={500}
                  placeholder={en ? "Auditable reason for funding" : "Motif traçable de l’approvisionnement"}
                  aria-invalid={touched.reason && reason.trim().length < 8 || undefined}
                />
                {touched.reason ? (
                  <p className="text-xs text-muted-foreground">
                    {en ? "At least 8 characters are required for an auditable reason." : "Au moins 8 caractères sont requis pour un motif traçable."}
                  </p>
                ) : null}
              </div>

              <div>
                <Button type="submit" disabled={!accountReference || create.isPending}>
                  {create.isPending ? (en ? "Creating…" : "Création…") : (en ? "Create request" : "Créer la demande")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {!requests.data?.items?.length ? (
        <EmptyState title={en ? "No funding request" : "Aucune demande d’approvisionnement"} />
      ) : (
        <>
          <ul className="native-list divide-y divide-border md:hidden">
            {(requests.data.items ?? []).map((request) => (
              <li key={request.id} className="space-y-4 p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{request.holderName}</p>
                    <p className="text-caption mt-1 text-muted-foreground">{request.accountReference}</p>
                  </div>
                  <StatusBadge
                    label={request.status === "PENDING" ? (en ? "Pending" : "En attente") : request.status === "APPROVED" ? (en ? "Approved" : "Approuvé") : (en ? "Rejected" : "Refusé")}
                    tone={request.status === "PENDING" ? "pending" : request.status === "APPROVED" ? "success" : "failed"}
                  />
                </div>
                <p className="text-amount text-foreground">{formatMoneyFromMinor(request.amountMinor, { currency: request.currency })}</p>
                <div className="rounded-md bg-surface-sunken p-3">
                  <p className="text-caption text-muted-foreground">{en ? "Reason" : "Motif"}</p>
                  <p className="text-body-sm mt-1">{request.reason}</p>
                  <p className="text-caption mt-2 text-muted-foreground">Maker · {request.makerName}</p>
                </div>
                {request.status === "PENDING" && canApprove ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => void makeDecision(request.id, true)} disabled={decide.isPending} loading={decide.isPending}>{en ? "Approve" : "Approuver"}</Button>
                    <Button variant="outline" onClick={() => void makeDecision(request.id, false)} disabled={decide.isPending} loading={decide.isPending}>{en ? "Reject" : "Refuser"}</Button>
                  </div>
                ) : request.checkerName ? (
                  <p className="text-caption text-muted-foreground">Checker · {request.checkerName}</p>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-md border border-border bg-surface md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{en ? "Account" : "Compte"}</TableHead>
                  <TableHead>{en ? "Amount" : "Montant"}</TableHead>
                  <TableHead>{en ? "Reason" : "Motif"}</TableHead>
                  <TableHead>Maker</TableHead>
                  <TableHead>{en ? "Status" : "Statut"}</TableHead>
                  <TableHead>{en ? "Decision" : "Décision"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(requests.data.items ?? []).map((request) => (
                  <TableRow key={request.id}>
                    <TableCell><p className="font-medium">{request.holderName}</p><p className="text-xs text-muted-foreground">{request.accountReference}</p></TableCell>
                    <TableCell>{formatMoneyFromMinor(request.amountMinor, { currency: request.currency })}</TableCell>
                    <TableCell className="max-w-xs">{request.reason}</TableCell>
                    <TableCell>{request.makerName}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={request.status === "PENDING" ? (en ? "Pending" : "En attente") : request.status === "APPROVED" ? (en ? "Approved" : "Approuvé") : (en ? "Rejected" : "Refusé")}
                        tone={request.status === "PENDING" ? "pending" : request.status === "APPROVED" ? "success" : "failed"}
                      />
                    </TableCell>
                    <TableCell>
                      {request.status === "PENDING" && canApprove ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => void makeDecision(request.id, true)} disabled={decide.isPending} loading={decide.isPending}>{en ? "Approve" : "Approuver"}</Button>
                          <Button size="sm" variant="outline" onClick={() => void makeDecision(request.id, false)} disabled={decide.isPending} loading={decide.isPending}>{en ? "Reject" : "Refuser"}</Button>
                        </div>
                      ) : request.checkerName ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={!fundingHistory.length || requests.isFetching}
              onClick={goPrevious}
            >
              {en ? "Previous" : "Précédent"}
            </Button>
            <Button
              variant="outline"
              disabled={!requests.data.hasNext || requests.isFetching}
              onClick={goNext}
            >
              {en ? "Next" : "Suivant"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
