import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Search } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
const STATUS_TONE: Record<DocumentLifecycleStatus, "success" | "pending" | "failed" | "neutral"> = {
  READY: "success",
  GENERATING: "pending",
  FAILED: "failed",
  SUPERSEDED: "neutral",
};

const STATUS_LABEL: Record<DocumentLifecycleStatus, string> = {
  READY: "Disponible",
  GENERATING: "En préparation",
  FAILED: "Échec",
  SUPERSEDED: "Remplacé",
};

const STATUS_LABEL_EN: Record<DocumentLifecycleStatus, string> = {
  READY: "Available",
  GENERATING: "Preparing",
  FAILED: "Needs attention",
  SUPERSEDED: "Replaced",
};

/** period_end is exclusive server-side; the label shows the last covered day. */
function periodLabel(statement: StatementDto): string {
  const end = new Date(new Date(statement.periodEnd).getTime() - 86_400_000);
  return `${formatDate(statement.periodStart)} → ${formatDate(end)}`;
}

function StatementRow({ statement, en }: { statement: StatementDto; en: boolean }) {
  const money = (minor: number) =>
    formatMoneyFromMinor(minor, {
      currency: statement.currency,
      minorUnitScale: 10 ** statement.minorUnit,
    });

  const balances = [
    {
      label: en ? "Opening balance" : "Solde d'ouverture",
      value: money(statement.openingBalanceMinor),
    },
    { label: en ? "Credits" : "Crédits", value: money(statement.totalCreditMinor) },
    { label: en ? "Debits" : "Débits", value: money(statement.totalDebitMinor) },
    {
      label: en ? "Closing balance" : "Solde de clôture",
      value: money(statement.closingBalanceMinor),
      highlight: true,
    },
  ];

  return (
    <Card className="group flex h-full flex-col gap-4 overflow-hidden p-4 motion-safe:transition-[box-shadow,border-color,transform] motion-safe:duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText aria-hidden className="size-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-foreground">{periodLabel(statement)}</p>
            <p className="truncate text-caption text-muted-foreground">
              {statement.accountDisplayName} · {statement.accountReference}
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {statement.reference}
            </p>
          </div>
        </div>
        <StatusBadge
          label={(en ? STATUS_LABEL_EN : STATUS_LABEL)[statement.status]}
          tone={STATUS_TONE[statement.status]}
        />
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 bg-muted/30 p-3 sm:grid-cols-4">
        {balances.map((cell) => (
          <div key={cell.label} className="min-w-0 space-y-1">
            <dt className="text-caption text-muted-foreground">{cell.label}</dt>
            <dd
              className={`truncate text-numeric text-sm font-semibold ${cell.highlight ? "text-primary" : "text-foreground"}`}
            >
              {cell.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
        <p className="text-caption text-muted-foreground">
          {statement.transactionCount} {en ? "transactions" : "opération(s)"}
          {statement.generatedAt
            ? ` · ${en ? "Issued" : "Édité"} ${formatDate(statement.generatedAt)}`
            : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/app/statements/$statementRef" params={{ statementRef: statement.reference }}>
              {en ? "View details" : "Consulter"}
            </Link>
          </Button>
          {statement.status === "READY" && statement.documentReference ? (
            <DocumentActions reference={statement.documentReference} />
          ) : null}
        </div>
      </div>

      {statement.status === "FAILED" ? (
        <p role="alert" className="text-caption text-danger">
          {statementErrorMessage(statement.failureCode)}
        </p>
      ) : null}
    </Card>
  );
}

export function StatementList() {
  const { language } = useLanguage();
  const en = language === "en";
  const [search, setSearch] = useState("");
  const { data, isPending, isError, refetch } = useStatements();
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return data ?? [];
    return (data ?? []).filter((statement) =>
      [
        statement.reference,
        statement.accountDisplayName,
        statement.accountReference,
        periodLabel(statement),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [data, search]);

  if (isPending) return <SkeletonBlock lines={6} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={en ? "Your statements will appear here" : "Vos relevés apparaîtront ici"}
        description={
          en
            ? "Choose an account and a period above to request your first official statement."
            : "Choisissez un compte et une période ci-dessus pour demander votre premier relevé officiel."
        }
      />
    );
  }

  return (
    <section className="space-y-4" aria-label={en ? "Statement history" : "Historique des relevés"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {en ? "Statement history" : "Historique des relevés"}
          </h2>
          <p className="text-caption text-muted-foreground">
            {en
              ? `${data.length} statement(s) in your history`
              : `${data.length} relevé(s) dans votre historique`}
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              en
                ? "Search by period, account or reference"
                : "Rechercher par période, compte ou référence"
            }
            aria-label={en ? "Search statements" : "Rechercher des relevés"}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={en ? "No matching statements" : "Aucun relevé correspondant"}
          description={
            en
              ? "Try another period, account name or reference."
              : "Essayez une autre période, un nom de compte ou une référence."
          }
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((statement) => (
            <StatementRow key={statement.reference} statement={statement} en={en} />
          ))}
        </div>
      )}
    </section>
  );
}
