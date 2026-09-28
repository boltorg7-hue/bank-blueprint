import { useLiveFinancialSettings } from "@/features/settings/useLiveFinancialSettings";
import { formatMoneyFromMinor } from "@/lib/format/currency";
import { formatUsdtFromMinor, usdMinorToUsdtMinor } from "@/config/currency";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Explicit recap shown before confirmation (§88 – §92).
 * Every figure is a server value; nothing is computed here.
 */
export function TransferSummary({
  amountMinor,
  currency,
  minorUnit,
  recipientDisplay,
  destinationMasked,
  sourceLabel,
  sourceMasked,
  note,
}: {
  amountMinor: number;
  currency: string;
  minorUnit: number;
  recipientDisplay: string;
  destinationMasked: string;
  sourceLabel: string;
  sourceMasked: string;
  note?: string | null;
}) {
  const { language } = useLanguage();
  const en = language === "en";
  useLiveFinancialSettings();
  const rows: Array<{ label: string; value: string }> = [
    { label: en ? "Recipient" : "Bénéficiaire", value: recipientDisplay },
    { label: en ? "Destination account" : "Compte destinataire", value: `•••• ${destinationMasked}` },
    { label: en ? "Source account" : "Compte à débiter", value: `${sourceLabel} · •••• ${sourceMasked}` },
    { label: en ? "Fees" : "Frais", value: en ? "No fee for an internal transfer" : "Aucun frais pour un virement interne" },
    { label: en ? "USDT equivalent" : "Équivalent en USDT", value: formatUsdtFromMinor(usdMinorToUsdtMinor(amountMinor)) },
  ];
  if (note) rows.push({ label: en ? "Reference" : "Référence", value: note });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface-sunken p-4 text-center">
        <p className="text-caption text-muted-foreground">{en ? "Transfer amount" : "Montant du virement"}</p>
        <p className="text-amount text-2xl font-semibold text-foreground">
          {formatMoneyFromMinor(amountMinor, {
            currency,
            minorUnitScale: 10 ** minorUnit,
          })}
        </p>
      </div>
      <dl className="divide-y divide-border rounded-lg border border-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 px-4 py-3">
            <dt className="text-caption text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 text-right text-sm font-medium text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
