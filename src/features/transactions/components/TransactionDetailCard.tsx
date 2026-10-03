import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <div className="space-y-4">
      <section
        aria-label={en ? "Transaction amount" : "Montant de l'opération"}
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

      <section aria-label={en ? "Transaction details" : "Détail de l'opération"} className="rounded-xl border border-border bg-surface p-5">
        <dl className="divide-y divide-border">
          <DetailRow label={en ? "Reference" : "Référence"} value={<span className="text-numeric">{transaction.reference}</span>} />
          <DetailRow label="Type" value={transactionTypeLabel(transaction.type, transaction.direction, en ? "en" : "fr")} />
          <DetailRow label={en ? "Direction" : "Sens"} value={en ? (transaction.direction === "INCOMING" ? "Incoming" : transaction.direction === "OUTGOING" ? "Outgoing" : "Neutral") : directionLabel(transaction.direction, en ? "en" : "fr")} />
          <DetailRow label={en ? "Transaction date" : "Date de l'opération"} value={formatDateTime(transaction.occurredAt)} />
          {transaction.completedAt ? (
            <DetailRow label={en ? "Value date" : "Date de valeur"} value={formatDateTime(transaction.completedAt)} />
          ) : null}
          <DetailRow
            label={en ? "Account" : "Compte concerné"}
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
            <DetailRow label={en ? "Counterparty" : "Contrepartie"} value={transaction.counterpartyDisplay} />
          ) : null}
          {transaction.displayDescription ? (
            <DetailRow label={en ? "Description" : "Libellé"} value={transaction.displayDescription} />
          ) : null}
          {transaction.reversedByReference ? (
            <DetailRow
              label={en ? "Reversed by" : "Contre-passée par"}
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

      <section
        aria-label={en ? "Transaction receipt" : "Reçu de l'opération"}
        className="rounded-xl border border-border bg-surface p-5"
      >
        <h2 className="text-sm font-semibold text-foreground">{en ? "Official receipt" : "Reçu officiel"}</h2>
        <p className="text-caption mt-1 mb-3 text-muted-foreground">
          {en ? "The bank issues this receipt from the transaction record." : "Le reçu est édité par la banque à partir de la comptabilité de l'opération."}
        </p>
        <OperationReceiptButton
          documentType="TRANSACTION_RECEIPT"
          sourceReference={transaction.reference}
          available={transaction.status === "COMPLETED"}
        />
      </section>
    </div>
  );
}
