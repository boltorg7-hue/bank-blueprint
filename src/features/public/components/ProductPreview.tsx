import { ArrowRight } from "lucide-react";

import { AccountCard } from "@/components/data-display/AccountCard";
import { KpiCard } from "@/components/data-display/KpiCard";
import { TransactionRow } from "@/components/data-display/TransactionRow";
import { TransferProgress } from "@/components/data-display/TransferProgress";
import { cn } from "@/lib/utils";

/**
 * Marketing product preview (§16, §17, §67).
 * Uses fixed demo data only — never real customer data, never fake products
 * (no cards, no investments, no crypto). Timestamps are static so the preview
 * renders identically on the server and the client.
 */
const DEMO = {
  accountName: "Compte courant",
  iban: "FR7630001007941234567890189",
  balance: 4820.35,
  inflow: 3210,
  outflow: 1940.2,
  transactions: [
    {
      title: "Virement reçu — Salaire",
      subtitle: "Vaultis SA",
      amount: 2450,
      direction: "credit" as const,
      date: "2026-03-02T09:12:00.000Z",
      statusLabel: "Exécuté",
    },
    {
      title: "Virement émis — Loyer",
      subtitle: "Bénéficiaire enregistré",
      amount: 780,
      direction: "debit" as const,
      date: "2026-03-01T08:05:00.000Z",
      statusLabel: "Exécuté",
    },
    {
      title: "Paiement — Abonnement",
      subtitle: "Prélèvement",
      amount: 12.99,
      direction: "debit" as const,
      date: "2026-02-28T18:40:00.000Z",
      statusLabel: "En attente",
    },
  ],
};

/** Compact variant for the homepage hero — legible from 320px. */
export function AccountPreview({ compact = false, className }: { compact?: boolean; className?: string }) {
  const transactions = compact ? DEMO.transactions.slice(0, 2) : DEMO.transactions;

  return (
    <div
      aria-label="Aperçu de l'espace client"
      role="img"
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-elevated)] sm:p-5",
        className,
      )}
    >
      <AccountCard
        name={DEMO.accountName}
        identifier={DEMO.iban}
        balance={DEMO.balance}
        statusLabel="Actif"
        meta={<span className="text-caption text-muted-foreground">Aperçu — données de démonstration</span>}
      />
      {!compact && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <KpiCard label="Entrées du mois" value={`+ ${DEMO.inflow.toLocaleString("fr-FR")} €`} />
          <KpiCard label="Sorties du mois" value={`- ${DEMO.outflow.toLocaleString("fr-FR")} €`} />
        </div>
      )}
      <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-background px-2 py-1">
        {transactions.map((tx) => (
          <TransactionRow
            key={tx.title}
            title={tx.title}
            subtitle={tx.subtitle}
            amount={tx.amount}
            direction={tx.direction}
            date={tx.date}
            statusLabel={tx.statusLabel}
            statusTone={tx.statusLabel === "En attente" ? "pending" : "success"}
          />
        ))}
      </div>
    </div>
  );
}

/** Transfer tracking preview used by the transfers story section (§18). */
export function TransferPreview({ className }: { className?: string }) {
  return (
    <div
      aria-label="Aperçu du suivi d'un virement"
      role="img"
      className={cn("rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]", className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="text-overline text-muted-foreground">Virement</p>
          <p className="text-heading-sm text-numeric truncate text-foreground">1 250,00 €</p>
        </div>
        <div className="text-caption flex items-center gap-2 text-muted-foreground">
          <span className="truncate">Compte courant</span>
          <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Marie L.</span>
        </div>
      </div>
      <TransferProgress
        className="mt-4"
        stages={[
          { id: "created", label: "Demande enregistrée", state: "done", timestamp: "14:32" },
          { id: "checks", label: "Contrôles de sécurité", state: "done", timestamp: "14:33" },
          { id: "executed", label: "Exécution", state: "current" },
          { id: "credited", label: "Fonds crédités", state: "upcoming" },
        ]}
      />
    </div>
  );
}

/** Document review preview used by the documents story section (§22). */
export function DocumentPreview({ className }: { className?: string }) {
  const documents = [
    { name: "Pièce d'identité", status: "Accepté", tone: "success" as const },
    { name: "Justificatif de domicile", status: "En revue", tone: "pending" as const },
    { name: "Justificatif d'origine des fonds", status: "Action requise", tone: "warning" as const },
  ];

  return (
    <div
      aria-label="Aperçu du centre de documents"
      role="img"
      className={cn("rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]", className)}
    >
      <p className="text-overline text-muted-foreground">Documents</p>
      <ul className="mt-3 space-y-2">
        {documents.map((doc) => (
          <li
            key={doc.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-3"
          >
            <span className="text-body-sm min-w-0 truncate text-foreground">{doc.name}</span>
            <span
              className={cn(
                "text-caption shrink-0 rounded-full px-2 py-0.5 font-medium",
                doc.tone === "success" && "bg-success-muted text-success",
                doc.tone === "pending" && "bg-info-muted text-info",
                doc.tone === "warning" && "bg-warning-muted text-warning",
              )}
            >
              {doc.status}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-caption mt-3 text-muted-foreground">
        Aperçu — documents de démonstration, sans donnée personnelle.
      </p>
    </div>
  );
}

/** Statement preview used by the statements section (§21). */
export function StatementPreview({ className }: { className?: string }) {
  const rows = [
    { label: "Relevé de mars 2026", meta: "PDF · 3 pages" },
    { label: "Relevé de février 2026", meta: "PDF · 2 pages" },
    { label: "Relevé de janvier 2026", meta: "PDF · 2 pages" },
  ];

  return (
    <div
      aria-label="Aperçu des relevés de compte"
      role="img"
      className={cn("rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]", className)}
    >
      <p className="text-overline text-muted-foreground">Relevés</p>
      <ul className="mt-3 divide-y divide-border">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 py-3">
            <span className="text-body-sm min-w-0 truncate text-foreground">{row.label}</span>
            <span className="text-caption shrink-0 text-muted-foreground">{row.meta}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
