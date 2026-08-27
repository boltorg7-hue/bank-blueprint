import { Link } from "@tanstack/react-router";

import { EmptyState } from "@/components/feedback";
import { TransactionRow } from "@/components/data-display";
import type { CustomerTransactionDto } from "@/features/transactions/types/transaction";
import {
  toMajorUnits,
  transactionAmountAriaLabel,
  transactionStatusLabel,
  transactionStatusTone,
} from "@/features/transactions/utils/transaction-display";

/**
 * Mobile-first activity list (§83, §84, §160). Rows — never a table — on
 * small screens, each row navigating to the transaction detail.
 */
export function TransactionList({
  items,
  emptyTitle = "Aucune opération",
  emptyDescription = "Dès qu'une opération sera enregistrée sur votre compte, elle apparaîtra ici.",
}: {
  items: CustomerTransactionDto[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((item) => (
        <li key={`${item.reference}-${item.accountReference}-${item.direction}`}>
          <Link
            to="/app/transactions/$transactionRef"
            params={{ transactionRef: item.reference }}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${item.displayTitle}. ${transactionAmountAriaLabel(
              item.amountMinor,
              item.currency,
              item.minorUnit,
              item.direction,
            )}. ${transactionStatusLabel(item.status)}`}
          >
            <TransactionRow
              className="px-3"
              title={item.displayTitle}
              {...(item.counterpartyDisplay || item.displayDescription
                ? { subtitle: item.counterpartyDisplay ?? item.displayDescription ?? "" }
                : {})}
              amount={toMajorUnits(item.amountMinor, item.minorUnit)}
              currency={item.currency}
              direction={item.direction === "INCOMING" ? "credit" : "debit"}
              date={item.occurredAt}
              statusLabel={transactionStatusLabel(item.status)}
              statusTone={transactionStatusTone(item.status)}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
