import { useLiveFinancialSettings } from "@/features/settings/useLiveFinancialSettings";
import { Receipt } from "lucide-react";

import { FEE_DEBIT_ACTIVE, FEE_SCHEDULE, feeMinorFor, transferFeeCode } from "@/config/fees";
import { formatMoneyFromMinor } from "@/lib/format/currency";
import type { TransferKind } from "@/features/transfers/types/transfer";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();
  const en = language === "en";
  useLiveFinancialSettings();
  const code = transferFeeCode(kind);
  const feeMinor = feeMinorFor(code, currency);
  const scale = 10 ** minorUnit;
  const money = (minor: number) =>
    formatMoneyFromMinor(minor, { currency, minorUnitScale: scale });

  const feeLabel =
    feeMinor === null ? (en ? "No fee applied" : "Aucun frais appliqué") : feeMinor === 0 ? (en ? "No fee" : "Sans frais") : money(feeMinor);

  return (
    <div
      role="note"
      aria-label={en ? "Applicable transfer fees" : "Frais applicables au virement"}
      className="space-y-2 rounded-xl border border-border bg-surface-sunken p-4"
    >
      <div className="flex items-center gap-2">
        <Receipt aria-hidden className="size-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">{en ? "Transfer fees" : "Frais de ce virement"}</p>
      </div>

      <dl className="space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-caption text-muted-foreground">{en ? (kind === "EXTERNAL_TRANSFER" ? "External transfer" : "Internal transfer") : FEE_SCHEDULE[code].label}</dt>
          <dd className="text-numeric text-sm font-semibold text-foreground">{feeLabel}</dd>
        </div>
        {typeof amountMinor === "number" ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-caption text-muted-foreground">{en ? "Total debited from your account" : "Total débité de votre compte"}</dt>
            <dd className="text-numeric text-sm font-semibold text-foreground">
              {money(amountMinor + (FEE_DEBIT_ACTIVE ? (feeMinor ?? 0) : 0))}
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="text-caption text-muted-foreground">
        {feeMinor === null || feeMinor === 0
          ? (en ? "Only the transfer amount is debited from your account." : "Seul le montant du virement est débité de votre compte.")
          : FEE_DEBIT_ACTIVE
            ? (en ? "The fee and transfer amount are debited together in one transaction." : "Les frais sont débités avec le virement, en une seule opération comptable.")
            : (en ? "Published fees: only the transfer amount is currently debited from your account." : "Frais publiés au barème : seul le montant du virement est débité de votre compte pour le moment.")}
      </p>
    </div>
  );
}
