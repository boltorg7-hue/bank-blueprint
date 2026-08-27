import { useState } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { AccountCoordinates } from "@/features/accounts/types/account";

/**
 * Banking coordinates (§45, §46, §110).
 *
 * The full account number is masked by default and revealed only on an
 * explicit customer action. IBAN is optional: fields that do not exist in the
 * account's jurisdiction are simply not rendered.
 */
function maskFull(value: string): string {
  return `•••• •••• ${value.slice(-4)}`;
}

export function AccountCoordinatesPanel({
  coordinates,
  holderName,
}: {
  coordinates: AccountCoordinates;
  holderName: string;
}) {
  const [revealed, setRevealed] = useState(false);

  const rows: Array<{ label: string; value: string; copyable?: boolean }> = [
    { label: "Titulaire", value: holderName },
    {
      label: "Numéro de compte",
      value: revealed ? coordinates.accountNumber : maskFull(coordinates.accountNumber),
      copyable: revealed,
    },
  ];
  if (coordinates.iban) rows.push({ label: "IBAN", value: coordinates.iban, copyable: true });
  if (coordinates.bic) rows.push({ label: "SWIFT / BIC", value: coordinates.bic, copyable: true });
  if (coordinates.bankCode) rows.push({ label: "Code banque", value: coordinates.bankCode });
  if (coordinates.branchCode) rows.push({ label: "Code agence", value: coordinates.branchCode });

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copié`);
    } catch {
      toast.error("Copie impossible sur cet appareil");
    }
  };

  return (
    <section
      aria-labelledby="coordinates-heading"
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="coordinates-heading" className="text-heading-sm text-foreground">
          Coordonnées bancaires
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setRevealed((value) => !value)}>
          {revealed ? (
            <>
              <EyeOff className="size-4" aria-hidden="true" /> Masquer
            </>
          ) : (
            <>
              <Eye className="size-4" aria-hidden="true" /> Afficher le numéro
            </>
          )}
        </Button>
      </div>

      <dl className="mt-4 divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-3">
            <dt className="text-caption text-muted-foreground">{row.label}</dt>
            <dd className="text-numeric text-body flex min-w-0 items-center gap-2 text-foreground">
              <span className="truncate">{row.value}</span>
              {row.copyable && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Copier ${row.label}`}
                  onClick={() => copy(row.label, row.value)}
                >
                  <Copy className="size-4" aria-hidden="true" />
                </Button>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
