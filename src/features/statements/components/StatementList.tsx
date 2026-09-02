import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/feedback";
import { DocumentActions } from "@/features/documents/components/DocumentActions";
import { useStatements } from "@/features/statements/hooks/useStatements";
import {
  statementErrorMessage,
  type DocumentLifecycleStatus,
  type StatementDto,
} from "@/features/statements/types/statement";
import { formatMoneyFromMinor } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";

/** Issued statements, newest first (PROMPT 09 §18 – §27). */
const STATUS_TONE: Record<DocumentLifecycleStatus, "success" | "warning" | "danger" | "neutral"> = {
  READY: "success",
  GENERATING: "warning",
  FAILED: "danger",
  SUPERSEDED: "neutral",
};

const STATUS_LABEL: Record<DocumentLifecycleStatus, string> = {
  READY: "Disponible",
  GENERATING: "En préparation",
  FAILED: "Échec",
  SUPERSEDED: "Remplacé",
};

/** period_end is exclusive server-side; the label shows the last covered day. */
function periodLabel(statement: StatementDto): string {
  const end = new Date(new Date(statement.periodEnd).getTime() - 86_400_000);
  return `${formatDate(statement.periodStart)} → ${formatDate(end)}`;
}

function StatementRow({ statement }: { statement: StatementDto }) {
  const money = (minor: number) =>
    formatMoneyFromMinor(minor, {
      currency: statement.currency,
      minorUnitScale: 10 ** statement.minorUnit,
    });

  return (
    <Card className="space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{periodLabel(statement)}</p>
          <p className="text-caption text-muted-foreground">
            {statement.accountDisplayName} · {statement.accountReference}
          </p>
          <p className="text-numeric text-caption text-muted-foreground">{statement.reference}</p>
        </div>
        <StatusBadge
          label={STATUS_LABEL[statement.status]}
          tone={STATUS_TONE[statement.status]}
        />
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3 sm:grid-cols-4">
        {[
          { label: "Solde d'ouverture", value: money(statement.openingBalanceMinor) },
          { label: "Crédits", value: money(statement.totalCreditMinor) },
          { label: "Débits", value: money(statement.totalDebitMinor) },
          { label: "Solde de clôture", value: money(statement.closingBalanceMinor) },
        ].map((cell) => (
          <div key={cell.label} className="min-w-0">
            <dt className="text-caption text-muted-foreground">{cell.label}</dt>
            <dd className="text-numeric truncate text-sm font-medium text-foreground">
              {cell.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-caption text-muted-foreground">
        {statement.transactionCount} opération(s)
        {statement.generatedAt ? ` · édité le ${formatDate(statement.generatedAt)}` : ""}
      </p>

      {statement.status === "FAILED" ? (
        <p role="alert" className="text-caption text-danger">
          {statementErrorMessage(statement.failureCode)}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" asChild>
          <Link to="/app/statements/$statementRef" params={{ statementRef: statement.reference }}>
            Consulter
          </Link>
        </Button>
        {statement.status === "READY" && statement.documentReference ? (
          <DocumentActions reference={statement.documentReference} />
        ) : null}
      </div>
    </Card>
  );

}

export function StatementList() {
  const { data, isPending, isError, refetch } = useStatements();

  if (isPending) return <SkeletonBlock lines={6} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Aucun relevé émis"
        description="Choisissez un compte et une période pour éditer votre premier relevé officiel."
      />
    );
  }

  return (
    <div className="space-y-4">
      {data.map((statement) => (
        <StatementRow key={statement.reference} statement={statement} />
      ))}
    </div>
  );
}
