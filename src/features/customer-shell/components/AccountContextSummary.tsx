import { ChevronDown, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccountContext } from "@/features/customer-shell/context/AccountContext";
import { cn } from "@/lib/utils";

/**
 * Compact account context (§23, §24): a selector only when several accounts
 * exist, otherwise a plain read-only summary. Full account numbers are never
 * displayed here.
 */
export function AccountContextSummary({ className }: { className?: string }) {
  const { selectedAccount, accounts, hasMultipleAccounts, selectAccount, isUnavailable } =
    useAccountContext();

  if (isUnavailable || !selectedAccount) {
    return (
      <p className={cn("truncate text-sm text-muted-foreground", className)}>
        Compte en préparation
      </p>
    );
  }

  if (!hasMultipleAccounts) {
    return (
      <p
        className={cn("flex min-w-0 items-center gap-2 text-sm text-muted-foreground", className)}
      >
        <Wallet className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">
          {selectedAccount.label} · {selectedAccount.maskedNumber} · {selectedAccount.currency}
        </span>
      </p>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("max-w-[16rem]", className)}>
          <Wallet className="size-4" aria-hidden="true" />
          <span className="truncate">
            {selectedAccount.label} · {selectedAccount.maskedNumber}
          </span>
          <ChevronDown className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Choisir un compte</DropdownMenuLabel>
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.reference}
            onSelect={() => selectAccount(account.reference)}
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{account.label}</span>
              <span className="text-xs text-muted-foreground">
                {account.maskedNumber} · {account.currency}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
