import { Link } from "@tanstack/react-router";

import { usePrivacyMode } from "@/components/providers/PrivacyModeProvider";
import { PRIVACY_PLACEHOLDER } from "@/lib/format/mask";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format/date";
import type { CustomerTransactionDto } from "@/features/transactions/types/transaction";
import {
  formatTransactionAmount,
  transactionAmountAriaLabel,
  transactionStatusLabel,
  transactionStatusTone,
  transactionTypeLabel,
} from "@/features/transactions/utils/transaction-display";

/**
 * Desktop history table (§85). Internal accounting identifiers are never
 * displayed; the reference shown is the customer-safe public reference.
 */
export function TransactionTable({ items }: { items: CustomerTransactionDto[] }) {
  const { privacyMode } = usePrivacyMode();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <Table>
        <caption className="sr-only">Historique de vos opérations, du plus récent au plus ancien</caption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Date</TableHead>
            <TableHead scope="col">Libellé</TableHead>
            <TableHead scope="col">Type</TableHead>
            <TableHead scope="col" className="text-right">
              Montant
            </TableHead>
            <TableHead scope="col">Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={`${item.reference}-${item.direction}`}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(item.occurredAt)}
              </TableCell>
              <TableCell className="max-w-[22ch] truncate">
                <Link
                  to="/app/transactions/$transactionRef"
                  params={{ transactionRef: item.reference }}
                  className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.displayTitle}
                </Link>
                {item.counterpartyDisplay || item.displayDescription ? (
                  <span className="text-caption block truncate text-muted-foreground">
                    {item.counterpartyDisplay ?? item.displayDescription}
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {transactionTypeLabel(item.type, item.direction)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className="text-numeric tabular-nums"
                  aria-label={transactionAmountAriaLabel(
                    item.amountMinor,
                    item.currency,
                    item.minorUnit,
                    item.direction,
                  )}
                >
                  {privacyMode
                    ? PRIVACY_PLACEHOLDER
                    : formatTransactionAmount(
                        item.amountMinor,
                        item.currency,
                        item.minorUnit,
                        item.direction,
                      )}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge
                  label={transactionStatusLabel(item.status)}
                  tone={transactionStatusTone(item.status)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
