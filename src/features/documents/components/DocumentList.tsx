import { memo, useState } from "react";
import { FileCheck2, FileText, Mail, ReceiptText, Search } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/feedback";
import { DocumentActions } from "@/features/documents/components/DocumentActions";
import { useDocuments } from "@/features/documents/hooks/useDocuments";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  type CustomerDocumentDto,
  type DocumentFilter,
} from "@/features/documents/types/document";
import type { DocumentLifecycleStatus } from "@/features/statements/types/statement";
import { formatDateTime } from "@/lib/format/date";

/** Customer document centre (PROMPT 09 §55 – §73). */
const FILTERS: Array<{ value: DocumentFilter; label: string; labelEn: string }> = [
  { value: "ALL", label: "Tous", labelEn: "All" },
  { value: "STATEMENTS", label: "Relevés", labelEn: "Statements" },
  { value: "RECEIPTS", label: "Reçus", labelEn: "Receipts" },
  { value: "LETTERS", label: "Courriers", labelEn: "Letters" },
];

const DOCUMENT_TYPE_LABELS_EN: Record<CustomerDocumentDto["documentType"], string> = {
  ACCOUNT_STATEMENT: "Account statement",
  TRANSFER_RECEIPT: "Transfer receipt",
  TRANSACTION_RECEIPT: "Transaction receipt",
  BANK_LETTER: "Bank letter",
  ACCOUNT_CERTIFICATE: "Account certificate",
};

const DOCUMENT_STATUS_LABELS_EN: Record<DocumentLifecycleStatus, string> = {
  READY: "Available",
  GENERATING: "Preparing",
  FAILED: "Failed",
  SUPERSEDED: "Replaced",
};

const STATUS_TONE: Record<DocumentLifecycleStatus, "success" | "pending" | "failed" | "neutral"> = {
  READY: "success",
  GENERATING: "pending",
  FAILED: "failed",
  SUPERSEDED: "neutral",
};

function fileSize(bytes: number | null): string | null {
  if (bytes === null) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function documentIcon(type: CustomerDocumentDto["documentType"]) {
  if (type === "TRANSFER_RECEIPT" || type === "TRANSACTION_RECEIPT") return ReceiptText;
  if (type === "BANK_LETTER") return Mail;
  if (type === "ACCOUNT_CERTIFICATE") return FileCheck2;
  return FileText;
}

const DocumentRow = memo(function DocumentRow({ document }: { document: CustomerDocumentDto }) {
  const { language } = useLanguage();
  const en = language === "en";
  const size = fileSize(document.sizeBytes);
  const Icon = documentIcon(document.documentType);

  return (
    <Card className="group flex h-full flex-col gap-4 overflow-hidden p-4 sm:p-5 motion-safe:transition-[box-shadow,border-color,transform] motion-safe:duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon aria-hidden className="size-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
              {document.title}
            </p>
            <p className="text-caption text-muted-foreground">
              {en
                ? DOCUMENT_TYPE_LABELS_EN[document.documentType]
                : DOCUMENT_TYPE_LABELS[document.documentType]}
            </p>
          </div>
        </div>
        <StatusBadge
          label={
            en
              ? DOCUMENT_STATUS_LABELS_EN[document.status]
              : DOCUMENT_STATUS_LABELS[document.status]
          }
          tone={STATUS_TONE[document.status]}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {document.accountReference ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-caption text-muted-foreground">
            {document.accountReference}
          </span>
        ) : null}
        {size ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-caption text-muted-foreground">
            {size}
          </span>
        ) : null}
        {document.version > 1 ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-caption text-muted-foreground">
            {en ? `Version ${document.version}` : `Version ${document.version}`}
          </span>
        ) : null}
      </div>

      <div className="mt-auto space-y-3 border-t border-border/70 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-caption text-muted-foreground">
            {document.generatedAt
              ? `${en ? "Issued" : "Émis"} ${en ? "on" : "le"} ${formatDateTime(document.generatedAt)}`
              : `${en ? "Requested" : "Demandé"} ${en ? "on" : "le"} ${formatDateTime(document.createdAt)}`}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">{document.reference}</p>
        </div>
        {document.status === "READY" ? (
          <DocumentActions reference={document.reference} />
        ) : document.status === "GENERATING" ? (
          <p className="text-caption text-muted-foreground">
            {en
              ? "Your document is being prepared."
              : "Votre document est en cours de préparation."}
          </p>
        ) : null}
      </div>
    </Card>
  );
});

export function DocumentList() {
  const { language } = useLanguage();
  const en = language === "en";
  const [filter, setFilter] = useState<DocumentFilter>("ALL");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const { data, isPending, isError, refetch } = useDocuments(filter, cursor);
  const query = search.trim().toLocaleLowerCase();
  const visibleDocuments = (data?.items ?? []).filter((document) =>
    [
      document.title,
      document.reference,
      document.accountReference ?? "",
      en
        ? DOCUMENT_TYPE_LABELS_EN[document.documentType]
        : DOCUMENT_TYPE_LABELS[document.documentType],
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query),
  );

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText aria-hidden className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {en ? "Your document library" : "Votre espace documentaire"}
              </p>
              <p className="text-caption text-muted-foreground">
                {en
                  ? "Find and securely access your banking documents."
                  : "Retrouvez et consultez vos documents bancaires en toute sécurité."}
              </p>
            </div>
          </div>
          {data && !isPending && !isError ? (
            <p className="shrink-0 text-sm font-medium text-muted-foreground">
              {en
                ? `${data.items.length} documents on this page`
                : `${data.items.length} document(s) sur cette page`}
            </p>
          ) : null}
        </div>
      </Card>

      <div className="space-y-3">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              en
                ? "Search by title, reference or account"
                : "Rechercher par titre, référence ou compte"
            }
            aria-label={en ? "Search documents" : "Rechercher des documents"}
            className="pl-9"
          />
        </div>

        <div
          role="tablist"
          aria-label={en ? "Filter documents" : "Filtrer les documents"}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {FILTERS.map((entry) => (
            <Button
              key={entry.value}
              type="button"
              role="tab"
              aria-selected={filter === entry.value}
              size="sm"
              variant={filter === entry.value ? "default" : "outline"}
              className="shrink-0 rounded-full"
              onClick={() => {
                setFilter(entry.value);
                setCursor(null);
                setHistory([]);
              }}
            >
              {en ? entry.labelEn : entry.label}
            </Button>
          ))}
        </div>
      </div>

      {isPending ? (
        <SkeletonBlock lines={5} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={en ? "Your document space is ready" : "Votre espace documentaire est prêt"}
          description={
            en
              ? "Your statements, receipts and letters will appear here when they are issued."
              : "Vos relevés, reçus et courriers apparaîtront ici dès leur émission."
          }
        />
      ) : visibleDocuments.length === 0 ? (
        <EmptyState
          title={en ? "No matching documents" : "Aucun document correspondant"}
          description={
            en
              ? "Try another title, reference or account number."
              : "Essayez un autre titre, une autre référence ou un compte différent."
          }
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {visibleDocuments.map((document) => (
              <DocumentRow key={document.reference} document={document} />
            ))}
          </div>
          {history.length > 0 || data.hasNext ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-caption text-muted-foreground">
                {en ? "Browse your document history" : "Parcourez votre historique documentaire"}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!history.length}
                  onClick={() =>
                    setHistory((items) => {
                      const next = [...items];
                      setCursor(next.pop() || null);
                      return next;
                    })
                  }
                >
                  {en ? "Previous" : "Précédent"}
                </Button>
                <Button
                  variant="outline"
                  disabled={!data.hasNext}
                  onClick={() => {
                    if (!data.nextCursor) return;
                    setHistory((items) => [...items, cursor ?? ""]);
                    setCursor(data.nextCursor);
                  }}
                >
                  {en ? "Next" : "Suivant"}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
