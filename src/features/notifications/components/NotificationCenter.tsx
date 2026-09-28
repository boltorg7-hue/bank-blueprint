import { useState } from "react";
import { Archive, CheckCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useMarkAllRead, useNotifications, useUpdateNotification } from "@/features/notifications/hooks/useNotifications";
import { formatDateTime } from "@/lib/format";
import type { AppPath } from "@/lib/routing";

const FILTERS = [
  { key: "ALL", label: "Toutes" },
  { key: "ACCOUNT", label: "Comptes" },
  { key: "TRANSFER", label: "Opérations" },
  { key: "FUNDING", label: "Approvisionnements" },
  { key: "PRICING", label: "Tarifs" },
] as const;

const CATEGORY_LABEL: Record<string, string> = {
  ACCOUNT: "Compte", TRANSFER: "Opération", FUNDING: "Approvisionnement", PRICING: "Tarifs", SECURITY: "Sécurité", SERVICE: "Service",
};

export function NotificationCenter() {
  const q = useNotifications(), update = useUpdateNotification(), all = useMarkAllRead();
  const [filter, setFilter] = useState<string>("ALL");
  if (q.isPending) return <LoadingState label="Chargement des notifications…" />;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const items = (q.data?.items ?? []).filter((n) => filter === "ALL" || n.category === filter);
  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Changements importants sur vos comptes, les tarifs et vos opérations approuvées."
        action={q.data?.unreadCount ? (
          <Button variant="outline" onClick={() => all.mutate()} disabled={all.isPending}>
            <CheckCheck className="mr-2 size-4" />Tout marquer comme lu
          </Button>
        ) : undefined}
      />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {FILTERS.map((f) => (
          <Button key={f.key} size="sm" role="tab" aria-selected={filter === f.key} variant={filter === f.key ? "default" : "outline"} onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>
      {!items.length ? (
        <EmptyState title="Aucune notification" description="Vos alertes de compte, de tarifs et d'opérations apparaîtront ici." />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <article key={n.id} className={`rounded-xl border bg-surface p-4 ${n.readAt ? "" : "border-info/40"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{n.title}</h2>
                    <StatusBadge label={CATEGORY_LABEL[n.category] ?? n.category} tone={n.severity === "WARNING" || n.severity === "CRITICAL" ? "pending" : "neutral"} />
                    {!n.readAt ? <StatusBadge label="Nouveau" tone="info" /> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
                <Button size="icon" variant="ghost" aria-label="Archiver" onClick={() => update.mutate({ id: n.id, action: "ARCHIVE" })}>
                  <Archive className="size-4" />
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                {!n.readAt ? <Button size="sm" variant="outline" onClick={() => update.mutate({ id: n.id, action: "READ" })}>Marquer comme lu</Button> : null}
                {n.resourcePath ? (
                  <Button size="sm" asChild onClick={() => { if (!n.readAt) update.mutate({ id: n.id, action: "READ" }); }}>
                    <Link to={n.resourcePath as AppPath}>Voir le détail</Link>
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
