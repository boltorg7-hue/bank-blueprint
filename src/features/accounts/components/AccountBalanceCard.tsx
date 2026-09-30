import { Info } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PRIVACY_PLACEHOLDER } from "@/lib/format/mask";
import { usePrivacyMode } from "@/components/providers/PrivacyModeProvider";
import { formatDateTime } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import type { CustomerAccountSummaryDto } from "@/features/accounts/types/account";
import {
  accountStatusLabel,
  accountStatusTone,
  accountTypeLabel,
  formatAccountAmount,
} from "@/features/accounts/utils/account-display";

/**
 * Primary balance surface (§48 – §59).
 *
 * The AVAILABLE balance is the headline figure; the ledger balance and held
 * amount are shown as secondary context so the customer can reconcile them.
 * A missing balance renders as unavailable — never as 0.00.
 */
export function AccountBalanceCard({
  account,
  isRefreshing = false,
  isStale = false,
  onRetry,
  className,
}: {
  account: CustomerAccountSummaryDto | null;
  isRefreshing?: boolean;
  isStale?: boolean;
  onRetry?: () => void;
  className?: string;
}) {
  const { privacyMode } = usePrivacyMode();

  if (!account) {
    return (
      <section className={cn("native-surface p-5 sm:p-6", className)}>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-10 w-48" />
        <Skeleton className="mt-4 h-4 w-40" />
      </section>
    );
  }

  const balance = account.balance;
  const hidden = privacyMode;

  const renderAmount = (minor: number) =>
    hidden ? PRIVACY_PLACEHOLDER : formatAccountAmount(minor, account.currency, account.minorUnit);

  return (
    <section
      aria-labelledby="balance-card-heading"
      className={cn(
        "native-surface overflow-hidden border-t-2 border-t-brand p-5 sm:p-6",
        className,
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 id="balance-card-heading" className="text-heading-md truncate text-foreground sm:text-heading-lg">
            {account.displayName}
          </h2>
          <p className="text-caption text-numeric mt-0.5 text-muted-foreground sm:text-body-sm">
            {accountTypeLabel(account.accountType)} · ••••{account.maskedNumber.slice(-4)} ·{" "}
            {account.currency}
          </p>
        </div>
        <StatusBadge
          label={accountStatusLabel(account.status)}
          tone={accountStatusTone(account.status)}
        />
      </div>

      <div className="mt-6 sm:mt-8">
        <p className="text-overline text-muted-foreground">Solde disponible</p>
        {balance ? (
          <p
            className="text-balance-value mt-1.5 text-foreground"
            aria-label={
              hidden
                ? "Solde masqué"
                : `Solde disponible : ${formatAccountAmount(
                    balance.availableBalanceMinor,
                    account.currency,
                    account.minorUnit,
                  )}`
            }
          >
            {renderAmount(balance.availableBalanceMinor)}
          </p>
        ) : (
          <div className="mt-1">
            <p className="text-heading-sm text-muted-foreground">Solde indisponible</p>
            <p className="text-caption mt-1 text-muted-foreground">
              Nous n'avons pas pu récupérer votre solde. Aucun montant approximatif n'est affiché.
            </p>
            {onRetry && (
              <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                Réessayer
              </Button>
            )}
          </div>
        )}
      </div>

      {balance && (
        <>
          <dl className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
            <div className="rounded-md bg-surface-sunken p-3.5 transition-colors hover:bg-muted/50 sm:p-4">
              <dt className="text-caption text-muted-foreground sm:text-body-sm">Solde comptable</dt>
              <dd className="text-amount mt-1 text-foreground sm:text-heading-md">
                {renderAmount(balance.ledgerBalanceMinor)}
              </dd>
            </div>
            <div className="rounded-md bg-surface-sunken p-3.5 transition-colors hover:bg-muted/50 sm:p-4">
              <dt className="text-caption text-muted-foreground sm:text-body-sm">Montants réservés</dt>
              <dd className="text-amount mt-1 text-foreground sm:text-heading-md">
                {renderAmount(balance.heldBalanceMinor)}
              </dd>
            </div>
          </dl>

          <p className="text-caption mt-5 flex items-start gap-1.5 text-muted-foreground sm:mt-6">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span className="leading-normal">
              Le solde disponible tient compte des montants réservés. Dernière mise à jour :{" "}
              {formatDateTime(balance.calculatedAt)}.
              {isRefreshing && " Actualisation en cours…"}
              {isStale && !isRefreshing && " Cette valeur peut avoir changé."}
            </span>
          </p>
        </>
      )}
    </section>
  );
}
