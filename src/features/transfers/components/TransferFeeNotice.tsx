import { Receipt } from "lucide-react";

import { FEE_SCHEDULE, feeMinorFor, transferFeeCode } from "@/config/fees";
import { formatMoneyFromMinor } from "@/lib/format/currency";
import type { TransferKind } from "@/features/transfers/types/transfer";

/**
 * Fee disclosure shown BEFORE the debit (PROMPT 07/08 transparency rule).
 *
 * The component only renders the contracted fee from the central schedule: it
 * never computes a fee and never invents one. When no fee is contracted, it
 * states plainly that nothing beyond the transfer amount will be debited.
 */
export function TransferFeeNotice({
  kind,
  currency,
  minorUnit,
  amountMinor,
}: {
  kind: TransferKind;
  currency: string;
  minorUnit: number;
  /** Transfer amount, used only to display the total debited. */
  amountMinor?: number | null;
}) {
  const code = transferFeeCode(kind);
  const feeMinor = feeMinorFor(code, currency);
  const scale = 10 ** minorUnit;
  const money = (minor: number) =>
    formatMoneyFromMinor(minor, { currency, minorUnitScale: scale });

  const feeLabel =
    feeMinor === null ? "Aucun frais appliqué" : feeMinor === 0 ? "Sans frais" : money(feeMinor);

  return (
    <div
      role="note"
      aria-label="Frais applicables au virement"
      className="space-y-2 rounded-xl border border-border bg-surface-sunken p-4"
    >
      <div className="flex items-center gap-2">
        <Receipt aria-hidden className="size-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Frais de ce virement</p>
      </div>

      <dl className="space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-caption text-muted-foreground">{FEE_SCHEDULE[code].label}</dt>
          <dd className="text-numeric text-sm font-semibold text-foreground">{feeLabel}</dd>
        </div>
        {typeof amountMinor === "number" ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-caption text-muted-foreground">Total débité de votre compte</dt>
            <dd className="text-numeric text-sm font-semibold text-foreground">
              {money(amountMinor + (feeMinor ?? 0))}
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="text-caption text-muted-foreground">
        {feeMinor === null || feeMinor === 0
          ? "Seul le montant du virement est débité de votre compte."
          : "Les frais sont débités avec le virement, en une seule opération comptable."}
      </p>
    </div>
  );
}
