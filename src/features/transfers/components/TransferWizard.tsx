import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/feedback";
import { AddBeneficiaryDialog } from "@/features/beneficiaries/components/AddBeneficiaryDialog";
import { AddExternalBeneficiaryDialog } from "@/features/beneficiaries/components/AddExternalBeneficiaryDialog";
import { useBeneficiaries } from "@/features/beneficiaries/hooks/useBeneficiaries";
import { useCustomerAccounts } from "@/features/accounts/hooks/useAccounts";
import {
  useConfirmTransfer,
  useInitiateTransfer,
  useTransferLimits,
} from "@/features/transfers/hooks/useTransfers";
import { TransferSummary } from "@/features/transfers/components/TransferSummary";
import {
  transferErrorMessage,
  transferFailureMessage,
  transferKindLabel,
  transferStatusLabel,
  transferStatusTone,
} from "@/features/transfers/utils/transfer-display";
import { progressExplanation } from "@/features/transfers/utils/transfer-progress";
import type { TransferDetailDto } from "@/features/transfers/types/transfer";
import { formatMoneyFromMinor } from "@/lib/format/currency";

const STEPS = [
  { id: "beneficiary", label: "Bénéficiaire" },
  { id: "amount", label: "Montant" },
  { id: "review", label: "Récapitulatif" },
  { id: "result", label: "Confirmation" },
];

/** Converts a typed decimal amount into integer minor units, without rounding drift. */
function toMinorUnits(raw: string, minorUnit: number): number | null {
  const normalized = raw.replace(/[\s\u00a0\u202f]/g, "").replace(/,/g, ".");
  if (!/^\d+(\.\d{0,4})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const padded = fraction.padEnd(minorUnit, "0").slice(0, minorUnit);
  const minor = Number(`${whole}${padded}`);
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

/**
 * Guided internal transfer flow (§81 – §98, §117 – §122).
 * The client only collects intent: validation, reservation and posting are
 * server-side and atomic.
 */
export function TransferWizard({ initialBeneficiary }: { initialBeneficiary?: string | undefined }) {
  const navigate = useNavigate();
  const accountsQuery = useCustomerAccounts();
  const beneficiariesQuery = useBeneficiaries();

  const [stepIndex, setStepIndex] = useState(0);
  const [accountReference, setAccountReference] = useState<string | null>(null);
  const [beneficiaryReference, setBeneficiaryReference] = useState<string | null>(
    initialBeneficiary ?? null,
  );
  const [amountRaw, setAmountRaw] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<TransferDetailDto | null>(null);
  const [result, setResult] = useState<{
    status: TransferDetailDto["status"];
    kind: TransferDetailDto["kind"];
    progressState: TransferDetailDto["progressState"];
    progressPercent: number;
    failureCode: TransferDetailDto["failureCode"];
    transactionReference: string | null;
  } | null>(null);

  const initiate = useInitiateTransfer();
  const confirm = useConfirmTransfer();

  const accounts = useMemo(
    () => (accountsQuery.data ?? []).filter((account) => account.status === "ACTIVE"),
    [accountsQuery.data],
  );
  const beneficiaries = useMemo(
    () => (beneficiariesQuery.data ?? []).filter((item) => item.status === "ACTIVE"),
    [beneficiariesQuery.data],
  );

  const source = accounts.find((account) => account.reference === accountReference) ?? accounts[0];
  const beneficiary =
    beneficiaries.find((item) => item.reference === beneficiaryReference) ?? undefined;
  const minorUnit = source?.minorUnit ?? 2;
  const currency = source?.currency ?? "TTD";
  const limitsQuery = useTransferLimits(currency);

  const amountMinor = toMinorUnits(amountRaw, minorUnit);
  const available = source?.balance?.availableBalanceMinor ?? null;
  const overBalance = amountMinor !== null && available !== null && amountMinor > available;
  const limit = limitsQuery.data?.maxPerTransferMinor ?? null;
  const overLimit = amountMinor !== null && limit !== null && amountMinor > limit;

  if (accountsQuery.isPending || beneficiariesQuery.isPending) return <SkeletonBlock lines={5} />;
  if (accountsQuery.isError) {
    return <ErrorState onRetry={() => void accountsQuery.refetch()} />;
  }
  if (accounts.length === 0) {
    return (
      <EmptyState
        title="Aucun compte disponible"
        description="Un compte actif est nécessaire pour émettre un virement."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Stepper steps={STEPS} currentIndex={stepIndex} />

      {stepIndex === 0 ? (
        <Card className="space-y-5 p-4 sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="transfer-source">Compte à débiter</Label>
            <Select
              value={source?.reference ?? ""}
              onValueChange={(value) => setAccountReference(value)}
            >
              <SelectTrigger id="transfer-source" className="h-12">
                <SelectValue placeholder="Choisir un compte" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.reference} value={account.reference}>
                    {account.displayName} · •••• {account.maskedNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {available !== null ? (
              <p className="text-caption text-muted-foreground">
                Solde disponible :{" "}
                {formatMoneyFromMinor(available, {
                  currency,
                  minorUnitScale: 10 ** minorUnit,
                })}
              </p>
            ) : (
              <p className="text-caption text-muted-foreground">Solde disponible indisponible.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-beneficiary">Bénéficiaire</Label>
            {beneficiaries.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas encore de bénéficiaire enregistré.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <AddBeneficiaryDialog onAdded={(reference) => setBeneficiaryReference(reference)} />
                  <AddExternalBeneficiaryDialog
                    onAdded={(reference) => setBeneficiaryReference(reference)}
                  />
                </div>
              </div>
            ) : (
              <>
                <Select
                  value={beneficiary?.reference ?? ""}
                  onValueChange={(value) => setBeneficiaryReference(value)}
                >
                  <SelectTrigger id="transfer-beneficiary" className="h-12">
                    <SelectValue placeholder="Choisir un bénéficiaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {beneficiaries.map((item) => (
                      <SelectItem key={item.reference} value={item.reference}>
                        {(item.nickname ?? item.displayName) +
                          ` · •••• ${item.maskedNumber} · ` +
                          (item.kind === "EXTERNAL"
                            ? (item.bankName ?? "Autre banque")
                            : "Notre banque")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap items-center gap-3">
                  <AddBeneficiaryDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="px-0">
                        Ajouter un bénéficiaire de notre banque
                      </Button>
                    }
                    onAdded={(reference) => setBeneficiaryReference(reference)}
                  />
                  <AddExternalBeneficiaryDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="px-0">
                        Ajouter un bénéficiaire d'une autre banque
                      </Button>
                    }
                    onAdded={(reference) => setBeneficiaryReference(reference)}
                  />
                </div>
              </>
            )}
          </div>

          <Button
            className="w-full sm:w-auto"
            disabled={!source || !beneficiary}
            onClick={() => {
              setError(null);
              setStepIndex(1);
            }}
          >
            Continuer
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </Card>
      ) : null}

      {stepIndex === 1 && source && beneficiary ? (
        <Card className="space-y-5 p-4 sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Montant à envoyer</Label>
            <MoneyInput
              id="transfer-amount"
              currency={currency}
              value={amountRaw}
              invalid={overBalance || overLimit}
              onValueChange={(raw) => setAmountRaw(raw)}
            />
            {overBalance ? (
              <p role="alert" className="text-caption text-danger">
                Le montant dépasse votre solde disponible.
              </p>
            ) : null}
            {overLimit && limit !== null ? (
              <p role="alert" className="text-caption text-danger">
                Le plafond par virement est de{" "}
                {formatMoneyFromMinor(limit, { currency, minorUnitScale: 10 ** minorUnit })}.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-note">Référence pour le bénéficiaire (optionnel)</Label>
            <Input
              id="transfer-note"
              maxLength={140}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ex. Loyer septembre"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setStepIndex(0)} className="w-full sm:w-auto">
              Retour
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={amountMinor === null || overBalance || overLimit || initiate.isPending}
              onClick={() => {
                if (amountMinor === null || !source || !beneficiary) return;
                setError(null);
                initiate.mutate(
                  {
                    sourceAccountReference: source.reference,
                    beneficiaryReference: beneficiary.reference,
                    amountMinor,
                    customerReference: note.trim(),
                  },
                  {
                    onSuccess: (created) => {
                      setTransfer(created);
                      setStepIndex(2);
                    },
                    onError: (mutationError) => setError(transferErrorMessage(mutationError)),
                  },
                );
              }}
            >
              {initiate.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Vérifier le virement
            </Button>
          </div>

          {error ? (
            <p role="alert" className="text-caption flex items-start gap-2 text-danger">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </Card>
      ) : null}

      {stepIndex === 2 && transfer && source ? (
        <Card className="space-y-5 p-4 sm:p-5">
          <TransferSummary
            amountMinor={transfer.amountMinor}
            currency={transfer.currency}
            minorUnit={transfer.minorUnit}
            recipientDisplay={transfer.recipientDisplay}
            destinationMasked={transfer.destinationMasked}
            sourceLabel={source.displayName}
            sourceMasked={transfer.sourceMasked}
            note={transfer.customerReference}
          />
          <div className="space-y-2">
            <p className="text-caption text-muted-foreground">
              Destination retenue par la banque : {transferKindLabel(transfer.kind)}.
            </p>
            {transfer.kind === "EXTERNAL_TRANSFER" ? (
              <p className="text-caption text-muted-foreground">
                En confirmant, le montant est réservé sur votre compte, puis transmis à la banque
                destinataire après vérification. Un justificatif peut vous être demandé : le
                virement n'est pas instantané et vous suivrez chaque étape.
              </p>
            ) : (
              <p className="text-caption text-muted-foreground">
                En confirmant, le montant est débité de votre compte. Un virement exécuté ne peut
                pas être annulé ; une correction éventuelle prend la forme d'une opération
                distincte.
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={confirm.isPending}
              onClick={() => setStepIndex(1)}
            >
              Modifier
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={confirm.isPending}
              onClick={() => {
                setError(null);
                confirm.mutate(transfer.reference, {
                  onSuccess: (outcome) => {
                    setResult({
                      status: outcome.status,
                      kind: outcome.kind,
                      progressState:
                        outcome.status === "COMPLETED" ? "COMPLETED" : transfer.progressState,
                      progressPercent: outcome.progressPercent,
                      failureCode: outcome.failureCode,
                      transactionReference: outcome.transactionReference,
                    });
                    setStepIndex(3);
                  },
                  onError: (mutationError) => setError(transferErrorMessage(mutationError)),
                });
              }}
            >
              {confirm.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {confirm.isPending ? "Exécution du virement…" : "Confirmer et envoyer"}
            </Button>
          </div>

          {error ? (
            <p role="alert" className="text-caption flex items-start gap-2 text-danger">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}
        </Card>
      ) : null}

      {stepIndex === 3 && transfer && result ? (
        <Card className="space-y-5 p-4 sm:p-5 text-center">
          <div className="flex flex-col items-center gap-3">
            {result.status === "COMPLETED" ? (
              <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
            ) : result.failureCode ? (
              <AlertTriangle className="size-10 text-danger" aria-hidden="true" />
            ) : (
              <Loader2 className="size-10 text-primary" aria-hidden="true" />
            )}
            <StatusBadge
              label={transferStatusLabel(result.status)}
              tone={transferStatusTone(result.status)}
            />
            <p className="text-sm text-muted-foreground">
              {result.status === "COMPLETED"
                ? "Le virement a été exécuté et enregistré dans votre historique."
                : (transferFailureMessage(result.failureCode) ??
                  progressExplanation({
                    status: result.status,
                    kind: result.kind,
                    progressState: result.progressState,
                    progressPercent: result.progressPercent,
                  }))}
            </p>
            {result.status !== "COMPLETED" && !result.failureCode ? (
              <p className="text-caption text-muted-foreground">
                Avancement : {result.progressPercent} %. Aucun montant n'est définitivement débité
                tant que le virement n'est pas terminé.
              </p>
            ) : null}
            <p className="text-caption text-muted-foreground">
              Référence du virement : {transfer.reference}
              {result.transactionReference ? ` · Opération ${result.transactionReference}` : ""}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => void navigate({ to: "/app/transfers" })}
            >
              Voir mes virements
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
                void navigate({
                  to: "/app/transfers/$transferRef",
                  params: { transferRef: transfer.reference },
                })
              }
            >
              Voir le détail
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
