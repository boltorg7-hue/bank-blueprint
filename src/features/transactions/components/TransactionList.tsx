import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { EmptyState } from "@/components/feedback";
import { TransactionRow } from "@/components/data-display";
import type { CustomerTransactionDto } from "@/features/transactions/types/transaction";
import {
  toMajorUnits,
  transactionAmountAriaLabel,
  transactionStatusLabel,
  transactionStatusTone,
  transactionTypeLabel,
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
  const { language } = useLanguage();
  const en = language === "en";

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="native-list divide-y divide-border">
      {items.map((item) => (
        <li key={`${item.reference}-${item.accountReference}-${item.direction}`}>
          <Link
            to="/app/transactions/$transactionRef"
            params={{ transactionRef: item.reference }}
            className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`${transactionTypeLabel(item.type, item.direction, en ? "en" : "fr")}. ${transactionAmountAriaLabel(
              item.amountMinor,
              item.currency,
              item.minorUnit,
              item.direction,
            )}. ${transactionStatusLabel(item.status)}`}
          >
            <TransactionRow
              className="px-3"
              title={transactionTypeLabel(item.type, item.direction, en ? "en" : "fr")}
              {...(item.counterpartyDisplay || item.displayDescription
                ? { subtitle: item.counterpartyDisplay ?? item.displayDescription ?? "" }
                : {})}
              amount={toMajorUnits(item.amountMinor, item.minorUnit)}
              currency={item.currency}
              direction={item.direction === "INCOMING" ? "credit" : "debit"}
              date={item.occurredAt}
              statusLabel={transactionStatusLabel(item.status, en ? "en" : "fr")}
              statusTone={transactionStatusTone(item.status)}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
