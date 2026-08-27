import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

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
  const balance = account.balance;

  return (
    <li>
      <Link
        to="/app/accounts/$accountRef"
        params={{ accountRef: account.reference }}
        className="press-feedback flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-heading-sm truncate text-foreground">{account.displayName}</p>
            {account.isPrimary && (
              <span className="text-caption rounded-full bg-surface-sunken px-2 py-0.5 text-muted-foreground">
                Principal
              </span>
            )}
          </div>
          <p className="text-caption text-numeric mt-0.5 text-muted-foreground">
            {accountTypeLabel(account.accountType)} · ••••{account.maskedNumber.slice(-4)}
          </p>
          <div className="mt-2">
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
              <p className="text-body text-muted-foreground">Solde indisponible</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge
            label={accountStatusLabel(account.status)}
            tone={accountStatusTone(account.status)}
          />
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
      </Link>
    </li>
  );
}
