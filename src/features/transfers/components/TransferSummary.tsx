import { formatMoneyFromMinor } from "@/lib/format/currency";

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
  const rows: Array<{ label: string; value: string }> = [
    { label: "Bénéficiaire", value: recipientDisplay },
    { label: "Compte destinataire", value: `•••• ${destinationMasked}` },
    { label: "Compte à débiter", value: `${sourceLabel} · •••• ${sourceMasked}` },
    { label: "Frais", value: "Aucun frais pour un virement interne" },
  ];
  if (note) rows.push({ label: "Référence", value: note });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface-sunken p-4 text-center">
        <p className="text-caption text-muted-foreground">Montant du virement</p>
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
