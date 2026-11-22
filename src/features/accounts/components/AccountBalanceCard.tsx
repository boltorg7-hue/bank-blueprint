import { useState } from "react";
import { Info, Wifi, Eye, EyeOff, Copy, Check } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PRIVACY_PLACEHOLDER } from "@/lib/format/mask";
import { usePrivacyMode } from "@/components/providers/PrivacyModeProvider";
import { formatDateTime } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { CustomerAccountSummaryDto } from "@/features/accounts/types/account";
import {
  accountStatusLabel,
  accountStatusTone,
  accountTypeLabel,
  formatAccountAmount,
} from "@/features/accounts/utils/account-display";

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
  const { privacyMode, togglePrivacyMode } = usePrivacyMode();
  const [copied, setCopied] = useState(false);
  const en = useLanguage().language === "en";

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

  const copyAccountRef = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(account.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-labelledby="balance-card-heading" className={cn("space-y-4", className)}>
      <div className="bank-card-container rounded-3xl p-5 sm:p-6 text-white border border-white/10 select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif tracking-widest text-xs uppercase font-bold text-amber-200/90">
              RFC BANK
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/50">· 1972</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="size-4 rotate-90 text-white/70" aria-hidden="true" />
            <StatusBadge
              label={
                en
                  ? {
                      PENDING: "Pending",
                      ACTIVE: "Active",
                      RESTRICTED: "Limited",
                      SUSPENDED: "Suspended",
                      FROZEN: "Blocked",
                      CLOSING: "Closing",
                      CLOSED: "Closed",
                    }[account.status]
                  : accountStatusLabel(account.status)
              }
              tone={accountStatusTone(account.status)}
              className="border-white/20 bg-white/10 text-white font-medium text-[11px]"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div aria-hidden="true" className="h-7 w-9 rounded-md bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-300 p-0.5 shadow-inner">
            <div className="h-full w-full rounded-[4px] border border-amber-600/30 grid grid-cols-2 gap-0.5 opacity-80" />
          </div>
          <button
            type="button"
            onClick={togglePrivacyMode}
            className="touch-press flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/15"
            title={hidden ? (en ? "Show balance" : "Afficher le solde") : (en ? "Hide balance" : "Masquer le solde")}
            aria-label={hidden ? (en ? "Show balance" : "Afficher le solde") : (en ? "Hide balance" : "Masquer le solde")}
          >
            {hidden ? <Eye className="size-3.5" aria-hidden="true" /> : <EyeOff className="size-3.5" aria-hidden="true" />}
            <span className="text-[10px] font-medium tracking-wide">{hidden ? (en ? "Show" : "Afficher") : (en ? "Hide" : "Masquer")}</span>
          </button>
        </div>

        <div className="mt-4">
          <h2 id="balance-card-heading" className="text-[11px] font-medium uppercase tracking-wider text-white/60">
            {en ? "Available Balance" : "Solde Disponible"}
          </h2>
          {balance ? (
            <p className="tabular-nums font-mono text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-0.5" aria-label={hidden ? (en ? "Balance hidden" : "Solde masqué") : undefined}>
              {renderAmount(balance.availableBalanceMinor)}
            </p>
          ) : (
            <div className="mt-1">
              <p className="text-sm text-white/70">{en ? "Updating balance…" : "Actualisation du solde…"}</p>
              {onRetry && <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>{en ? "Retry" : "Réessayer"}</Button>}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-3">
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">
              {en ? (account.accountType === "CURRENT" ? "Checking Account" : "Savings Account") : accountTypeLabel(account.accountType)}
            </p>
            <p className="font-mono text-xs text-white/90 tracking-wider">•••• {account.maskedNumber.slice(-4)}</p>
          </div>
          <button
            type="button"
            onClick={copyAccountRef}
            className="touch-press flex items-center gap-1 text-[11px] text-white/70 hover:text-white"
            aria-label={en ? "Copy account reference" : "Copier la référence du compte"}
          >
            {copied ? <Check className="size-3.5 text-emerald-400" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
            <span className="text-[10px]">{copied ? (en ? "Copied" : "Copié") : (en ? "Copy" : "Copier")}</span>
          </button>
        </div>
      </div>

      {balance && (
        <dl className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="native-surface rounded-2xl p-3.5 sm:p-4">
            <dt className="text-xs text-muted-foreground font-medium">{en ? "Ledger balance" : "Solde comptable"}</dt>
            <dd className="tabular-nums font-mono text-sm sm:text-base font-semibold text-foreground mt-1">{renderAmount(balance.ledgerBalanceMinor)}</dd>
          </div>
          <div className="native-surface rounded-2xl p-3.5 sm:p-4">
            <dt className="text-xs text-muted-foreground font-medium">{en ? "Held amounts" : "Montants réservés"}</dt>
            <dd className="tabular-nums font-mono text-sm sm:text-base font-semibold text-foreground mt-1">{renderAmount(balance.heldBalanceMinor)}</dd>
          </div>
        </dl>
      )}

      {balance && (
        <p className="text-[11px] flex items-center gap-1.5 text-muted-foreground px-1">
          <Info className="size-3 shrink-0" aria-hidden="true" />
          <span>
            {en ? "Updated: " : "Mis à jour : "}
            {formatDateTime(balance.calculatedAt)}
            {isRefreshing && (en ? " · Refreshing…" : " · Actualisation…")}
            {isStale && !isRefreshing && (en ? " · This value may have changed." : " · Cette valeur peut avoir changé.")}
          </span>
        </p>
      )}
    </section>
  );
}
