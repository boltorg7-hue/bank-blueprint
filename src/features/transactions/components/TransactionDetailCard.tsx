import { Link } from "@tanstack/react-router";

import { OperationReceiptButton } from "@/features/documents/components/OperationReceiptButton";


import { AmountText } from "@/components/data-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format/date";
import type { TransactionDetailDto } from "@/features/transactions/types/transaction";
import {
  directionLabel,
  toMajorUnits,
  transactionAmountAriaLabel,
  transactionStatusLabel,
  transactionStatusTone,
  transactionTypeLabel,
} from "@/features/transactions/utils/transaction-display";

/**
 * Transaction detail (§95 – §100). Customer-safe fields only: no ledger
 * entry, no accounting side, no internal note, no counterparty PII beyond
 * what the customer already provided.
 */
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="text-body max-w-[60%] break-words text-right text-foreground">{value}</dd>
    </div>
  );
}

export function TransactionDetailCard({ transaction }: { transaction: TransactionDetailDto }) {
  return (
    <div className="space-y-4">
      <section
        aria-label="Montant de l'opération"
        className="rounded-xl border border-border bg-surface p-5 text-center"
      >
        <p className="text-caption text-muted-foreground">{transaction.displayTitle}</p>
        <div className="mt-2 flex justify-center">
          <span
            aria-label={transactionAmountAriaLabel(
              transaction.amountMinor,
              transaction.currency,
              transaction.minorUnit,
              transaction.direction,
            )}
          >
            <AmountText
              amount={toMajorUnits(
                transaction.direction === "OUTGOING"
                  ? -transaction.amountMinor
                  : transaction.amountMinor,
                transaction.minorUnit,
              )}
              currency={transaction.currency}
              direction={
                transaction.direction === "INCOMING"
                  ? "credit"
                  : transaction.direction === "OUTGOING"
                    ? "debit"
                    : "neutral"
              }
            />
          </span>
        </div>
        <div className="mt-3 flex justify-center">
          <StatusBadge
            label={transactionStatusLabel(transaction.status)}
            tone={transactionStatusTone(transaction.status)}
          />
        </div>
      </section>

      <section aria-label="Détail de l'opération" className="rounded-xl border border-border bg-surface p-5">
        <dl className="divide-y divide-border">
          <DetailRow label="Référence" value={<span className="text-numeric">{transaction.reference}</span>} />
          <DetailRow label="Type" value={transactionTypeLabel(transaction.type, transaction.direction)} />
          <DetailRow label="Sens" value={directionLabel(transaction.direction)} />
          <DetailRow label="Date de l'opération" value={formatDateTime(transaction.occurredAt)} />
          {transaction.completedAt ? (
            <DetailRow label="Date de valeur" value={formatDateTime(transaction.completedAt)} />
          ) : null}
          <DetailRow
            label="Compte concerné"
            value={
              <Link
                to="/app/accounts/$accountRef"
                params={{ accountRef: transaction.accountReference }}
                className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {transaction.accountReference}
              </Link>
            }
          />
          {transaction.counterpartyDisplay ? (
            <DetailRow label="Contrepartie" value={transaction.counterpartyDisplay} />
          ) : null}
          {transaction.displayDescription ? (
            <DetailRow label="Libellé" value={transaction.displayDescription} />
          ) : null}
          {transaction.reversedByReference ? (
            <DetailRow
              label="Contre-passée par"
              value={
                <Link
                  to="/app/transactions/$transactionRef"
                  params={{ transactionRef: transaction.reversedByReference }}
                  className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {transaction.reversedByReference}
                </Link>
              }
            />
          ) : null}
        </dl>
      </section>
    </div>
  );
}
