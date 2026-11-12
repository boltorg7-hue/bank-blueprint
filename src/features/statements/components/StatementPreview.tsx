import { ArrowDownLeft, ArrowUpRight, CalendarDays, FileText, Landmark } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/feedback";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DocumentActions } from "@/features/documents/components/DocumentActions";
import { useStatementDetail } from "@/features/statements/hooks/useStatements";
import {
  statementErrorMessage,
  type DocumentLifecycleStatus,
} from "@/features/statements/types/statement";
import { formatMoneyFromMinor } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";

const STATUS_PRESENTATION: Record<
  DocumentLifecycleStatus,
  { fr: string; en: string; tone: "success" | "pending" | "failed" | "neutral" }
> = {
  READY: { fr: "Disponible", en: "Available", tone: "success" },
  GENERATING: { fr: "En préparation", en: "Preparing", tone: "pending" },
  FAILED: { fr: "À reprendre", en: "Needs attention", tone: "failed" },
  SUPERSEDED: { fr: "Remplacé", en: "Superseded", tone: "neutral" },
};

/**
 * HTML preview of an issued statement (PROMPT 09 §42, §43).
 *
 * Every figure comes from the immutable server snapshot: no client-side
 * computation of opening, running or closing balances.
 */
export function StatementPreview({ reference }: { reference: string }) {
  const { language } = useLanguage();
  const en = language === "en";
  const { data, isPending, isError, refetch } = useStatementDetail(reference);

  if (isPending) return <SkeletonBlock lines={8} />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) {
    return (
      <EmptyState
        title={en ? "Statement not found" : "Relevé introuvable"}
        description={
          en
            ? "This statement does not exist or is not linked to your account."
            : "Ce relevé n'existe pas ou n'est pas rattaché à votre espace."
        }
      />
    );
  }

  const money = (minor: number) =>
    formatMoneyFromMinor(minor, {
      currency: data.currency,
      minorUnitScale: 10 ** data.minorUnit,
    });
  const inclusiveEnd = new Date(new Date(data.periodEnd).getTime() - 86_400_000);
  const status = STATUS_PRESENTATION[data.status];
  const balances = [
    {
      label: en ? "Opening balance" : "Solde d'ouverture",
      value: money(data.openingBalanceMinor),
      detail: en ? "At period start" : "Au début de période",
    },
    {
      label: en ? "Total credits" : "Total des crédits",
      value: money(data.totalCreditMinor),
      detail: en ? "Money received" : "Entrées enregistrées",
    },
    {
      label: en ? "Total debits" : "Total des débits",
      value: money(data.totalDebitMinor),
      detail: en ? "Money spent" : "Sorties enregistrées",
    },
    {
      label: en ? "Closing balance" : "Solde de clôture",
      value: money(data.closingBalanceMinor),
      detail: en ? "At period end" : "À la fin de période",
      highlight: true,
    },
  ];

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.09] via-card to-card p-4 sm:p-6 print:border-0 print:shadow-none">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-primary/[0.06] blur-2xl"
        />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText aria-hidden className="size-6" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
                  {en ? "Official document" : "Document officiel"}
                </p>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {en ? "Account statement" : "Relevé de compte"}
                </h2>
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {data.reference}
                </p>
              </div>
            </div>
            <StatusBadge label={en ? status.en : status.fr} tone={status.tone} />
          </div>

          <div className="grid gap-3 rounded-xl border border-border/70 bg-background/65 p-3 sm:grid-cols-2 sm:p-4">
            <div className="flex min-w-0 items-start gap-3">
              <Landmark aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 space-y-1">
                <p className="text-caption text-muted-foreground">
                  {en ? "Account holder" : "Titulaire du compte"}
                </p>
                <p className="truncate text-sm font-semibold text-foreground">{data.holderName}</p>
                <p className="truncate text-caption text-muted-foreground">
                  {data.accountDisplayName} · {en ? "Account" : "Compte"} ••••{" "}
                  {data.accountMaskedNumber}
                </p>
              </div>
            </div>
            <div className="flex min-w-0 items-start gap-3">
              <CalendarDays aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 space-y-1">
                <p className="text-caption text-muted-foreground">
                  {en ? "Statement period" : "Période du relevé"}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(data.periodStart)} – {formatDate(inclusiveEnd)}
                </p>
                <p className="text-caption text-muted-foreground">
                  {data.transactionCount} {en ? "transactions" : "opérations"}
                  {data.generatedAt
                    ? ` · ${en ? "Issued" : "Émis"} ${formatDate(data.generatedAt)}`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          {data.status === "READY" && data.documentReference ? (
            <div className="print:hidden">
              <DocumentActions reference={data.documentReference} />
            </div>
          ) : null}

          {data.failureCode ? (
            <p role="alert" className="rounded-lg border border-danger/20 bg-danger-muted/40 px-3 py-2 text-caption text-danger">
              {statementErrorMessage(data.failureCode)}
            </p>
          ) : null}
        </div>
      </Card>

      <section aria-labelledby="statement-balances-title" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 id="statement-balances-title" className="text-base font-semibold text-foreground">
              {en ? "Balance summary" : "Synthèse des soldes"}
            </h3>
            <p className="text-caption text-muted-foreground">
              {en ? "Figures from the official statement" : "Montants issus du relevé officiel"}
            </p>
          </div>
          <span className="rounded-full bg-surface-sunken px-2.5 py-1 font-mono text-xs text-muted-foreground">
            {data.currency}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {balances.map((cell) => (
            <Card
              key={cell.label}
              className={`min-w-0 gap-2 p-3 sm:p-4 ${cell.highlight ? "border-primary/25 bg-primary/[0.04]" : ""}`}
            >
              <p className="text-caption leading-snug text-muted-foreground">{cell.label}</p>
              <p
                className={`break-words text-numeric text-sm font-semibold sm:text-base ${cell.highlight ? "text-primary" : "text-foreground"}`}
              >
                {cell.value}
              </p>
              <p className="text-[11px] text-muted-foreground">{cell.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="overflow-hidden p-0 print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-4 sm:px-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {en ? "Transactions for this period" : "Opérations de la période"}
            </h3>
            <p className="text-caption text-muted-foreground">
              {data.transactionCount} {en ? "recorded transactions" : "opérations enregistrées"}
            </p>
          </div>
          <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-caption font-medium text-muted-foreground">
            {en ? "Official record" : "Écritures officielles"}
          </span>
        </div>

        {data.lines.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-5">
            {en
              ? "No transactions recorded during this period."
              : "Aucune opération enregistrée sur cette période."}
          </p>
        ) : (
          <ul className="divide-y divide-border/70" role="list">
            {data.lines.map((line) => {
              const isCredit = line.direction === "CREDIT";
              const DirectionIcon = isCredit ? ArrowDownLeft : ArrowUpRight;
              return (
                <li
                  key={line.reference}
                  className="flex min-w-0 items-center gap-3 px-4 py-3.5 sm:px-5"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isCredit ? "bg-success-muted text-success" : "bg-surface-sunken text-muted-foreground"}`}
                  >
                    <DirectionIcon aria-hidden className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {line.description}
                    </p>
                    <p className="break-all text-caption text-muted-foreground">
                      {formatDate(line.occurredAt)} ·{" "}
                      <span className="font-mono">{line.reference}</span>
                    </p>
                  </div>
                  <div className="shrink-0 space-y-1 text-right">
                    <p
                      className={`text-numeric text-sm font-semibold ${isCredit ? "text-success" : "text-foreground"}`}
                    >
                      {isCredit ? "+" : "−"}
                      {money(line.amountMinor)}
                    </p>
                    <p className="text-numeric text-[11px] text-muted-foreground">
                      {en ? "Balance" : "Solde"}: {money(line.balanceMinor)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
