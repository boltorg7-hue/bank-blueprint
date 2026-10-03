import { memo, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const DocumentRow = memo(function DocumentRow({ document }: { document: CustomerDocumentDto }) {
  const { language } = useLanguage();
  const en = language === "en";
  const size = fileSize(document.sizeBytes);
  return (
    <Card className="space-y-3 p-4 sm:p-5 motion-safe:transition-[box-shadow,border-color,transform] motion-safe:duration-200 hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{document.title}</p>
          <p className="text-caption text-muted-foreground">
            {DOCUMENT_TYPE_LABELS[document.documentType]}
            {document.accountReference ? ` · ${document.accountReference}` : ""}
            {size ? ` · ${size}` : ""}
          </p>
          <p className="text-numeric text-caption text-muted-foreground">{document.reference}</p>
        </div>
        <StatusBadge
          label={DOCUMENT_STATUS_LABELS[document.status]}
          tone={STATUS_TONE[document.status]}
        />
      </div>

      <p className="text-caption text-muted-foreground">
        {document.generatedAt
          ? `${en ? "Edited" : "Édité"} ${en ? "on" : "le"} ${formatDateTime(document.generatedAt)}`
          : `${en ? "Requested" : "Demandé"} ${en ? "on" : "le"} ${formatDateTime(document.createdAt)}`}
        {document.version > 1 ? ` · ${en ? "version" : "version"} ${document.version}` : ""}
      </p>

      {document.status === "READY" ? <DocumentActions reference={document.reference} /> : null}
    </Card>
  );
});

export function DocumentList() {
  const { language } = useLanguage();
  const en = language === "en";
  const [filter, setFilter] = useState<DocumentFilter>("ALL");
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const { data, isPending, isError, refetch } = useDocuments(filter, cursor);

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label={en ? "Filter documents" : "Filtrer les documents"} className="flex flex-wrap gap-2">
        {FILTERS.map((entry) => (
          <Button
            key={entry.value}
            type="button"
            role="tab"
            aria-selected={filter === entry.value}
            size="sm"
            variant={filter === entry.value ? "default" : "outline"}
            onClick={() => { setFilter(entry.value); setCursor(null); setHistory([]); }}
          >
            {en ? entry.labelEn : entry.label}
          </Button>
        ))}
      </div>

      {isPending ? (
        <SkeletonBlock lines={5} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={en ? "No documents yet" : "Aucun document pour le moment"}
          description={en ? "Your statements, receipts and letters will appear here when they are issued." : "Vos relevés, reçus et courriers apparaîtront ici dès leur émission."}
        />
      ) : (
        <>
          {data.items.map((document) => <DocumentRow key={document.reference} document={document} />)}
          {(history.length > 0 || data.hasNext) ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={!history.length} onClick={() => setHistory((items) => { const next = [...items]; setCursor(next.pop() || null); return next; })}>{en ? "Previous" : "Précédent"}</Button>
              <Button variant="outline" disabled={!data.hasNext} onClick={() => { if (!data.nextCursor) return; setHistory((items) => [...items, cursor ?? ""]); setCursor(data.nextCursor); }}>{en ? "Next" : "Suivant"}</Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
