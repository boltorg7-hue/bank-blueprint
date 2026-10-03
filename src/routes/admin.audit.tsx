import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSection } from "@/components/ui/page-section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminGate } from "@/features/admin/components/AdminGate";
import { useAdminAudit } from "@/features/admin/hooks/useAdmin";
import type { AdminAuditEventDto } from "@/features/admin/types/admin";

export const Route = createFileRoute("/admin/audit")({ component: AdminAuditPage, head: () => ({ meta: [{ title: "Audit — Back-office" }, { name: "robots", content: "noindex, nofollow" }] }) });

function AdminAuditPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const query = useAdminAudit(search, cursor);
  return <AdminGate permission="audit.read">
    <PageSection>
    <PageHeader title={en ? "Audit trail" : "Journal d’audit"} description={en ? "Trace of sensitive back-office actions and authorization checks." : "Traçabilité des actions sensibles du back-office et des contrôles d’autorisation."} action={<Input aria-label={en ? "Search audit events" : "Rechercher dans l’audit"} placeholder={en ? "Action, resource or permission" : "Action, ressource ou permission"} value={search} onChange={(e) => { setSearch(e.target.value); setCursor(null); setCursorHistory([]); }} className="w-full sm:w-80" />}
    />
    </PageSection>
    <PageSection>
    {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !query.data?.items?.length ? <EmptyState title={en ? "No audit events found" : "Aucun événement d’audit"} /> : <><AuditList events={query.data.items} en={en} /><div className="mt-4 flex justify-center gap-2">{cursor ? <Button variant="outline" onClick={() => { const previous = cursorHistory.at(-1) ?? null; setCursorHistory((items) => items.slice(0, -1)); setCursor(previous); }}>{en ? "Previous" : "Précédent"}</Button> : null}<Button variant="outline" disabled={!query.data.hasNext || !query.data.nextCursor} onClick={() => { if (!query.data.nextCursor) return; setCursorHistory((items) => [...items, cursor ?? ""]); setCursor(query.data.nextCursor); }}>{en ? "Next" : "Suivant"}</Button></div></>}
    </PageSection>
  </AdminGate>;
}

function AuditList({ events, en }: { events: AdminAuditEventDto[]; en: boolean }) {
  return <div className="space-y-3">{events.map((event) => <article key={event.id} className="rounded-md border border-border bg-surface p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="font-semibold text-foreground">{event.action}</p><p className="text-xs text-muted-foreground">{event.actorName}{event.actorReference ? " · " + event.actorReference : ""} · {new Date(event.createdAt).toLocaleString()}</p></div>
      <StatusBadge label={event.result} tone={event.result === "ALLOWED" ? "success" : "failed"} />
    </div>
    <dl className="mt-3 grid gap-3 sm:grid-cols-3">
      <div><dt className="text-caption text-muted-foreground">{en ? "Resource" : "Ressource"}</dt><dd className="break-all text-sm">{event.resourceType ?? "—"}{event.resourceReference ? " · " + event.resourceReference : ""}</dd></div>
      <div><dt className="text-caption text-muted-foreground">{en ? "Permission checked" : "Permission contrôlée"}</dt><dd className="break-all text-sm">{event.permissionChecked ?? "—"}</dd></div>
      <div><dt className="text-caption text-muted-foreground">{en ? "Context" : "Contexte"}</dt><dd className="break-all text-xs text-muted-foreground">{Object.keys(event.context).length ? JSON.stringify(event.context) : "—"}</dd></div>
    </dl>
  </article>)}</div>;
}
