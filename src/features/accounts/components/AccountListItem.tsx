import { ChevronRight, WalletCards } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { StatusBadge } from "@/components/ui/status-badge";
import { usePrivacyMode } from "@/components/providers/PrivacyModeProvider";
import { PRIVACY_PLACEHOLDER } from "@/lib/format/mask";
import type { CustomerAccountSummaryDto } from "@/features/accounts/types/account";
import {
  accountStatusLabel,
  accountStatusTone,
  accountTypeLabel,
  formatAccountAmount,
} from "@/features/accounts/utils/account-display";

/**
 * Account list row (§40 – §47). Multi-account is the default shape: the list
 * renders identically for one or many accounts.
 */
export function AccountListItem({ account }: { account: CustomerAccountSummaryDto }) {
  const { privacyMode } = usePrivacyMode();
  const en = useLanguage().language === "en";
  const balance = account.balance;
  const statusLabel = en
    ? {
        PENDING: "In preparation",
        ACTIVE: "Active",
        RESTRICTED: "Limited",
        SUSPENDED: "Suspended",
        FROZEN: "Blocked",
        CLOSING: "Closing",
        CLOSED: "Closed",
      }[account.status]
    : accountStatusLabel(account.status);
  const typeLabel = en
    ? account.accountType === "CURRENT"
      ? "Current account"
      : "Savings account"
    : accountTypeLabel(account.accountType);

  return (
    <li>
      <Link
        to="/app/accounts/$accountRef"
        params={{ accountRef: account.reference }}
        className="native-surface press-feedback flex min-h-28 w-full items-center gap-3 rounded-2xl p-4 text-left motion-safe:transition-[border-color,box-shadow,transform] motion-safe:duration-150 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none sm:gap-4 sm:p-5"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/5 text-brand ring-1 ring-inset ring-brand/10 transition-colors motion-safe:duration-200 group-hover:bg-brand/10" aria-hidden="true">
          <WalletCards className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-heading-sm truncate text-foreground">{account.displayName}</p>
            {account.isPrimary && (
              <span className="text-caption rounded-full bg-surface-sunken px-2 py-0.5 text-muted-foreground">
                {en ? "Primary" : "Principal"}
              </span>
            )}
          </div>
          <p className="text-caption text-numeric mt-1 text-muted-foreground">
            {typeLabel} · ••••{account.maskedNumber.slice(-4)}
          </p>
          <div className="mt-2.5">
            {balance ? (
              <p className="text-amount text-foreground">
                {privacyMode
                  ? PRIVACY_PLACEHOLDER
                  : formatAccountAmount(
                      balance.availableBalanceMinor,
                      account.currency,
                      account.minorUnit,
                    )}
              </p>
            ) : (
              <p className="text-body text-muted-foreground">
                {en
                  ? "Balance details will appear when available."
                  : "Les informations de solde seront affichées dès leur disponibilité."}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge label={statusLabel} tone={accountStatusTone(account.status)} />
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
      </Link>
    </li>
  );
}
