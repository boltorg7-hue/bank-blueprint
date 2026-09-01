import { useState } from "react";

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
const FILTERS: Array<{ value: DocumentFilter; label: string }> = [
  { value: "ALL", label: "Tous" },
  { value: "STATEMENTS", label: "Relevés" },
  { value: "RECEIPTS", label: "Reçus" },
  { value: "LETTERS", label: "Courriers" },
];

const STATUS_TONE: Record<DocumentLifecycleStatus, "success" | "warning" | "danger" | "neutral"> = {
  READY: "success",
  GENERATING: "warning",
  FAILED: "danger",
  SUPERSEDED: "neutral",
};

function fileSize(bytes: number | null): string | null {
  if (bytes === null) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function DocumentRow({ document }: { document: CustomerDocumentDto }) {
  const size = fileSize(document.sizeBytes);
  return (
    <Card className="space-y-3 p-4 sm:p-5">
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
          ? `Édité le ${formatDateTime(document.generatedAt)}`
          : `Demandé le ${formatDateTime(document.createdAt)}`}
        {document.version > 1 ? ` · version ${document.version}` : ""}
      </p>

      {document.status === "READY" ? <DocumentActions reference={document.reference} /> : null}
    </Card>
  );
}

export function DocumentList() {
  const [filter, setFilter] = useState<DocumentFilter>("ALL");
  const { data, isPending, isError, refetch } = useDocuments(filter);

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Filtrer les documents" className="flex flex-wrap gap-2">
        {FILTERS.map((entry) => (
          <Button
            key={entry.value}
            type="button"
            role="tab"
            aria-selected={filter === entry.value}
            size="sm"
            variant={filter === entry.value ? "default" : "outline"}
            onClick={() => setFilter(entry.value)}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      {isPending ? (
        <SkeletonBlock lines={5} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Aucun document"
          description="Vos relevés et reçus apparaîtront ici dès qu'ils seront édités."
        />
      ) : (
        data.map((document) => <DocumentRow key={document.reference} document={document} />)
      )}
    </div>
  );
}
