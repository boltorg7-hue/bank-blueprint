import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/feedback";
import { DocumentActions } from "@/features/documents/components/DocumentActions";
import { useStatementDetail } from "@/features/statements/hooks/useStatements";
import { statementErrorMessage } from "@/features/statements/types/statement";
import { formatMoneyFromMinor } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";

/**
 * HTML preview of an issued statement (PROMPT 09 §42, §43).
 *
 * Every figure comes from the immutable server snapshot: no client-side
 * computation of opening, running or closing balances.
 */
export function StatementPreview({ reference }: { reference: string }) {
  const { data, isPending, isError, refetch } = useStatementDetail(reference);

  if (isPending) return <SkeletonBlock lines={8} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) {
    return (
      <EmptyState
        title="Relevé introuvable"
        description="Ce relevé n'existe pas ou n'est pas rattaché à votre espace."
      />
    );
  }

  const money = (minor: number) =>
    formatMoneyFromMinor(minor, {
      currency: data.currency,
      minorUnitScale: 10 ** data.minorUnit,
    });
  const inclusiveEnd = new Date(new Date(data.periodEnd).getTime() - 86_400_000);

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-4 sm:p-5 print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Relevé de compte</h2>
            <p className="text-numeric text-caption text-muted-foreground">{data.reference}</p>
            <p className="text-caption text-muted-foreground">
              {data.accountDisplayName} · {data.accountReference} · •••• {data.accountMaskedNumber}
            </p>
            <p className="text-caption text-muted-foreground">{data.holderName}</p>
          </div>
          <div className="text-right">
            <StatusBadge
              label={data.status === "READY" ? "Disponible" : "En préparation"}
              tone={data.status === "READY" ? "success" : "warning"}
            />
            <p className="text-caption mt-2 text-muted-foreground">
              {formatDate(data.periodStart)} → {formatDate(inclusiveEnd)}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3 sm:grid-cols-4">
          {[
            { label: "Solde d'ouverture", value: money(data.openingBalanceMinor) },
            { label: "Total des crédits", value: money(data.totalCreditMinor) },
            { label: "Total des débits", value: money(data.totalDebitMinor) },
            { label: "Solde de clôture", value: money(data.closingBalanceMinor) },
          ].map((cell) => (
            <div key={cell.label} className="min-w-0">
              <dt className="text-caption text-muted-foreground">{cell.label}</dt>
              <dd className="text-numeric truncate text-sm font-medium text-foreground">
                {cell.value}
              </dd>
            </div>
          ))}
        </dl>

        {data.failureCode ? (
          <p role="alert" className="text-caption text-danger">
            {statementErrorMessage(data.failureCode)}
          </p>
        ) : null}

        {data.status === "READY" && data.documentReference ? (
          <div className="print:hidden">
            <DocumentActions reference={data.documentReference} />
          </div>
        ) : null}
      </Card>

      <Card className="p-4 sm:p-5 print:border-0 print:shadow-none">
        <h3 className="text-sm font-semibold text-foreground">
          Opérations de la période ({data.transactionCount})
        </h3>
        {data.lines.length === 0 ? (
          <p className="text-caption mt-3 text-muted-foreground">
            Aucune opération enregistrée sur cette période.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border" role="list">
            {data.lines.map((line) => (
              <li key={line.reference} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{line.description}</p>
                  <p className="text-caption text-muted-foreground">
                    {formatDate(line.occurredAt)} · <span className="text-numeric">{line.reference}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`text-numeric text-sm font-medium ${
                      line.direction === "CREDIT" ? "text-success" : "text-foreground"
                    }`}
                  >
                    {line.direction === "CREDIT" ? "+" : "−"}
                    {money(line.amountMinor)}
                  </p>
                  <p className="text-numeric text-caption text-muted-foreground">
                    {money(line.balanceMinor)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
