import { useLanguage } from "@/components/providers/LanguageProvider";
import { useLiveFinancialSettings } from "@/features/settings/useLiveFinancialSettings";
import { useMemo, useRef, useState } from "react";
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
import { TransferFeeNotice } from "@/features/transfers/components/TransferFeeNotice";
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
import {
  QUOTE_UNITS,
  SETTLEMENT_CURRENCY,
  SETTLEMENT_MINOR_UNIT,
  USDT_MINOR_UNIT,
  formatUsdtFromMinor,
  quoteToSettlementMinor,
  usdMinorToUsdtMinor,
  usdtParityNotice,
  type QuoteUnit,
} from "@/config/currency";


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
  const { language } = useLanguage();
  const en = language === "en";
  useLiveFinancialSettings();
  const navigate = useNavigate();
  const accountsQuery = useCustomerAccounts();
  const beneficiariesQuery = useBeneficiaries();

  const [stepIndex, setStepIndex] = useState(0);
  const [accountReference, setAccountReference] = useState<string | null>(null);
  const [beneficiaryReference, setBeneficiaryReference] = useState<string | null>(
    initialBeneficiary ?? null,
  );
  const [amountRaw, setAmountRaw] = useState("");
  const [unit, setUnit] = useState<QuoteUnit>("USD");

  const [note, setNote] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
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
  const initiateLock = useRef(false);
  const confirmLock = useRef(false);

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
  const minorUnit = source?.minorUnit ?? SETTLEMENT_MINOR_UNIT;
  const currency = source?.currency ?? SETTLEMENT_CURRENCY;
  const limitsQuery = useTransferLimits(currency);

  /** Amount typed in the unit chosen by the customer (USD or USDT). */
  const enteredMinor = toMinorUnits(amountRaw, unit === "USDT" ? USDT_MINOR_UNIT : minorUnit);
  /** Amount actually debited: the account is always held in USD. */
  const amountMinor = enteredMinor === null ? null : quoteToSettlementMinor(enteredMinor, unit);
  /** Mirror figure shown live in the other unit, with no action from the user. */
  const mirrorLabel =
    amountMinor === null
      ? null
      : unit === "USDT"
        ? formatMoneyFromMinor(amountMinor, { currency, minorUnitScale: 10 ** minorUnit })
        : formatUsdtFromMinor(usdMinorToUsdtMinor(amountMinor));

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
        title={en ? "No account available" : "Aucun compte disponible"}
        description={en ? "An active account is required to make a transfer." : "Un compte actif est nécessaire pour émettre un virement."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Stepper steps={en ? STEPS.map((step) => ({ ...step, label: ({ beneficiary: "Recipient", amount: "Amount", review: "Review", result: "Confirmation" } as Record<string, string>)[step.id] ?? step.label })) : STEPS} currentIndex={stepIndex} />

      {stepIndex === 0 ? (
        <Card className="space-y-5 p-4 sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="transfer-source">{en ? "Source account" : "Compte à débiter"}</Label>
            <Select
              value={source?.reference ?? ""}
              onValueChange={(value) => setAccountReference(value)}
            >
              <SelectTrigger id="transfer-source" className="h-12">
                <SelectValue placeholder={en ? "Choose an account" : "Choisir un compte"} />
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
                {en ? "Available balance" : "Solde disponible"} :{" "}
                {formatMoneyFromMinor(available, {
                  currency,
                  minorUnitScale: 10 ** minorUnit,
                })}
              </p>
            ) : (
              <p className="text-caption text-muted-foreground">{en ? "Available balance unavailable." : "Solde disponible indisponible."}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-confirmation-password">{en ? "Confirm your password" : "Confirmez votre mot de passe"}</Label>
            <Input
              id="transfer-confirmation-password"
              type="password"
              autoComplete="current-password"
              value={confirmationPassword}
              onChange={(event) => setConfirmationPassword(event.target.value)}
              placeholder={en ? "Current password" : "Mot de passe actuel"}
              maxLength={128}
            />
            <p className="text-caption text-muted-foreground">
              {en ? "This check protects this sensitive transaction." : "Cette vérification protège l’exécution de l’opération sensible."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-beneficiary">{en ? "Recipient" : "Bénéficiaire"}</Label>
            {beneficiaries.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                <p className="text-sm text-muted-foreground">
                  {en ? "You have no saved recipients yet." : "Vous n'avez pas encore de bénéficiaire enregistré."}
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
                    <SelectValue placeholder={en ? "Choose a recipient" : "Choisir un bénéficiaire"} />
                  </SelectTrigger>
                  <SelectContent>
                    {beneficiaries.map((item) => (
                      <SelectItem key={item.reference} value={item.reference}>
                        {(item.nickname ?? item.displayName) +
                          ` · •••• ${item.maskedNumber} · ` +
                          (item.kind === "EXTERNAL"
                            ? (item.bankName ?? (en ? "Other bank" : "Autre banque"))
                            : (en ? "Our bank" : "Notre banque"))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap items-center gap-3">
                  <AddBeneficiaryDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="px-0">
                        {en ? "Add a recipient at our bank" : "Ajouter un bénéficiaire de notre banque"}
                      </Button>
                    }
                    onAdded={(reference) => setBeneficiaryReference(reference)}
                  />
                  <AddExternalBeneficiaryDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="px-0">
                        {en ? "Add a recipient at another bank" : "Ajouter un bénéficiaire d'une autre banque"}
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
            {en ? "Continue" : "Continuer"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </Card>
      ) : null}

      {stepIndex === 1 && source && beneficiary ? (
        <Card className="space-y-5 p-4 sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="transfer-amount">{en ? "Amount to send" : "Montant à envoyer"}</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <MoneyInput
                id="transfer-amount"
                className="flex-1"
                currency={currency}
                unitLabel={unit === "USDT" ? "USDT" : undefined}
                value={amountRaw}
                invalid={overBalance || overLimit}
                onValueChange={(raw) => setAmountRaw(raw)}
              />
              <Select value={unit} onValueChange={(value) => setUnit(value as QuoteUnit)}>
                <SelectTrigger
                  aria-label={en ? "Amount unit" : "Unité du montant"}
                  className="h-12 w-full sm:w-[190px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTE_UNITS.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {mirrorLabel ? (
              <p aria-live="polite" className="text-caption text-muted-foreground">
                {unit === "USDT"
                  ? `${en ? "Amount debited from your account" : "Montant débité de votre compte"} : ${mirrorLabel}`
                  : `${en ? "Equivalent" : "Équivalent"} : ${mirrorLabel}`}
              </p>
            ) : null}
            {unit === "USDT" ? (
              <p className="text-caption text-muted-foreground">{usdtParityNotice()}</p>
            ) : null}
            {overBalance ? (
              <p role="alert" className="text-caption text-danger">
                {en ? "The amount exceeds your available balance." : "Le montant dépasse votre solde disponible."}
              </p>
            ) : null}
            {overLimit && limit !== null ? (
              <p role="alert" className="text-caption text-danger">
                {en ? "The per-transfer limit is" : "Le plafond par virement est de"}{" "}
                {formatMoneyFromMinor(limit, { currency, minorUnitScale: 10 ** minorUnit })}.
              </p>
            ) : null}
          </div>


          <div className="space-y-2">
            <Label htmlFor="transfer-note">{en ? "Reference for recipient (optional)" : "Référence pour le bénéficiaire (optionnel)"}</Label>
            <Input
              id="transfer-note"
              maxLength={140}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={en ? "E.g. September rent" : "Ex. Loyer septembre"}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setStepIndex(0)} className="w-full sm:w-auto">
              {en ? "Back" : "Retour"}
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={amountMinor === null || overBalance || overLimit}
              loading={initiate.isPending}
              loadingLabel={en ? "Preparing transfer…" : "Préparation du virement…"}
              onClick={() => {
                if (initiateLock.current || amountMinor === null || !source || !beneficiary) return;
                initiateLock.current = true;
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
                    onSettled: () => {
                      initiateLock.current = false;
                    },
                  },
                );
              }}
            >
              {initiate.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {en ? "Review transfer" : "Vérifier le virement"}
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
          <TransferFeeNotice
            kind={transfer.kind}
            currency={transfer.currency}
            minorUnit={transfer.minorUnit}
            amountMinor={transfer.amountMinor}
          />
          <div className="space-y-2">
            <p className="text-caption text-muted-foreground">
              {en ? "Destination selected by the bank" : "Destination retenue par la banque"} : {en ? transfer.kind === "EXTERNAL_TRANSFER" ? "external transfer" : "internal transfer" : transferKindLabel(transfer.kind)}.
            </p>
            {transfer.kind === "EXTERNAL_TRANSFER" ? (
              <p className="text-caption text-muted-foreground">
                {en ? "On confirmation, the amount is reserved in your account, then sent to the receiving bank after verification. Supporting documents may be requested. This transfer is not instant; you can follow every step." : "En confirmant, le montant est réservé sur votre compte, puis transmis à la banque destinataire après vérification. Un justificatif peut vous être demandé : le virement n’est pas instantané et vous suivrez chaque étape."}
              </p>
            ) : (
              <p className="text-caption text-muted-foreground">
                {en ? "On confirmation, the amount is debited from your account. A completed transfer cannot be cancelled; any correction is a separate transaction." : "En confirmant, le montant est débité de votre compte. Un virement exécuté ne peut pas être annulé ; une correction éventuelle prend la forme d’une opération distincte."}
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
              disabled={false}
              loading={confirm.isPending}
              loadingLabel={en ? "Processing transfer…" : "Exécution du virement…"}
              onClick={() => {
                if (confirmLock.current) return;
                setError(null);
                if (!confirmationPassword) {
                  setError((en ? "Confirm your password before executing the transfer." : "Confirmez votre mot de passe avant d’exécuter le virement."));
                  return;
                }
                confirmLock.current = true;
                confirm.mutate({ reference: transfer.reference, password: confirmationPassword }, {
                  onSuccess: (outcome) => {
                    setConfirmationPassword("");
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
                  onSettled: () => {
                    confirmLock.current = false;
                  },
                });
              }}
            >
              {confirm.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {confirm.isPending ? (en ? "Processing transfer…" : "Exécution du virement…") : (en ? "Confirm and send" : "Confirmer et envoyer")}
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
                ? (en ? "The transfer was completed and added to your history." : "Le virement a été exécuté et enregistré dans votre historique.")
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
                {en ? "Progress" : "Avancement"} : {result.progressPercent} %. {en ? "No amount is permanently debited until the transfer is complete." : "Aucun montant n’est définitivement débité tant que le virement n’est pas terminé."}
              </p>
            ) : null}
            <p className="text-caption text-muted-foreground">
              {en ? "Transfer reference" : "Référence du virement"} : {transfer.reference}
              {result.transactionReference ? ` · ${en ? "Transaction" : "Opération"} ${result.transactionReference}` : ""}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => void navigate({ to: "/app/transfers" })}
            >
              {en ? "View my transfers" : "Voir mes virements"}
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
              {en ? "View details" : "Voir le détail"}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
