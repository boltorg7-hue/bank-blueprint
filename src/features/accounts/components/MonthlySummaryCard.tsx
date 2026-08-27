import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { usePrivacyMode } from "@/components/providers/PrivacyModeProvider";
import { PRIVACY_PLACEHOLDER } from "@/lib/format/mask";
import { formatAccountAmount } from "@/features/accounts/utils/account-display";
import type { MonthlySummaryDto } from "@/features/accounts/types/account";
import { BRAND } from "@/config/brand";

/**
 * Compact monthly aggregate (§60 – §66). Values come from the server; the
 * component performs no arithmetic. While the ledger is not in service the
 * period is genuinely empty and labelled as such — no invented figures.
 */
export function MonthlySummaryCard({ summary }: { summary: MonthlySummaryDto }) {
  const { privacyMode } = usePrivacyMode();

  const monthLabel = new Intl.DateTimeFormat(BRAND.locale.tag, {
    month: "long",
    year: "numeric",
  }).format(new Date(summary.periodStart));

  const show = (minor: number) =>
    privacyMode
      ? PRIVACY_PLACEHOLDER
      : formatAccountAmount(minor, summary.currency, summary.minorUnit);

  return (
    <section
      aria-labelledby="monthly-summary-heading"
      className="rounded-2xl border border-border bg-surface p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="monthly-summary-heading" className="text-heading-sm text-foreground">
          Ce mois-ci
        </h2>
        <p className="text-caption capitalize text-muted-foreground">{monthLabel}</p>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-sunken p-3">
          <dt className="text-caption flex items-center gap-1.5 text-muted-foreground">
            <ArrowDownLeft className="size-3.5 text-success" aria-hidden="true" />
            Entrées
          </dt>
          <dd className="text-amount mt-1 text-foreground">{show(summary.moneyInMinor)}</dd>
        </div>
        <div className="rounded-xl bg-surface-sunken p-3">
          <dt className="text-caption flex items-center gap-1.5 text-muted-foreground">
            <ArrowUpRight className="size-3.5 text-danger" aria-hidden="true" />
            Sorties
          </dt>
          <dd className="text-amount mt-1 text-foreground">{show(summary.moneyOutMinor)}</dd>
        </div>
        <div className="rounded-xl bg-surface-sunken p-3">
          <dt className="text-caption text-muted-foreground">Solde net</dt>
          <dd className="text-amount mt-1 text-foreground">{show(summary.netMinor)}</dd>
        </div>
      </dl>

      {!summary.ledgerAvailable && (
        <p className="text-caption mt-3 text-muted-foreground">
          Aucune opération n'a encore été enregistrée sur la période.
        </p>
      )}
    </section>
  );
}
