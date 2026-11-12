import { useState } from "react";
import {
  AlertTriangle,
  Archive,
  Bell,
  CheckCheck,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useMarkAllRead,
  useNotifications,
  useUpdateNotification,
} from "@/features/notifications/hooks/useNotifications";
import type { NotificationDto } from "@/domain/notifications/types";
import { formatDateTime } from "@/lib/format";
import type { AppPath } from "@/lib/routing";

const FILTERS = [
  { key: "ALL", label: "Toutes", labelEn: "All" },
  { key: "ACCOUNT", label: "Comptes", labelEn: "Accounts" },
  { key: "TRANSFER", label: "Opérations", labelEn: "Transactions" },
  { key: "FUNDING", label: "Approvisionnements", labelEn: "Funding" },
  { key: "PRICING", label: "Tarifs", labelEn: "Pricing" },
  { key: "SECURITY", label: "Sécurité", labelEn: "Security" },
  { key: "SERVICE", label: "Service", labelEn: "Service" },
] as const;

const CATEGORY_LABELS: Record<string, { fr: string; en: string }> = {
  ACCOUNT: { fr: "Compte", en: "Account" },
  TRANSFER: { fr: "Opération", en: "Transaction" },
  FUNDING: { fr: "Approvisionnement", en: "Funding" },
  PRICING: { fr: "Tarifs", en: "Pricing" },
  SECURITY: { fr: "Sécurité", en: "Security" },
  SERVICE: { fr: "Service", en: "Service" },
};

const CATEGORY_LABEL_EN: Record<string, string> = {
  ACCOUNT: "Account",
  TRANSFER: "Transaction",
  FUNDING: "Funding",
  PRICING: "Pricing",
  SECURITY: "Security",
  SERVICE: "Service",
};

const SEVERITY_LABELS: Record<NotificationDto["severity"], { fr: string; en: string }> = {
  INFO: { fr: "Information", en: "Information" },
  SUCCESS: { fr: "Confirmation", en: "Confirmation" },
  WARNING: { fr: "Attention", en: "Attention" },
  CRITICAL: { fr: "Prioritaire", en: "Critical" },
};

const SEVERITY_TONES: Record<
  NotificationDto["severity"],
  "neutral" | "success" | "pending" | "failed"
> = {
  INFO: "neutral",
  SUCCESS: "success",
  WARNING: "pending",
  CRITICAL: "failed",
};

type ReadFilter = "ALL" | "UNREAD" | "READ";

export function NotificationCenter() {
  const { language } = useLanguage();
  const en = language === "en";
  const [filter, setFilter] = useState<string>("ALL");
  const [readFilter, setReadFilter] = useState<ReadFilter>("ALL");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const query = useNotifications(filter, cursor);
  const update = useUpdateNotification();
  const markAll = useMarkAllRead();

  const items = query.data?.items ?? [];
  const term = search.trim().toLocaleLowerCase();
  const visibleItems = items.filter((notification) => {
    const matchesRead =
      readFilter === "ALL" ||
      (readFilter === "UNREAD" ? !notification.readAt : Boolean(notification.readAt));
    const matchesSearch = [
      notification.title,
      notification.body,
      notification.category,
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(term);
    return matchesRead && (!term || matchesSearch);
  });

  function selectCategory(next: string) {
    setFilter(next);
    setCursor(null);
    setHistory([]);
  }

  function changeNotification(id: string, action: "READ" | "ARCHIVE") {
    update.mutate(
      { id, action },
      {
        onSuccess: () => {
          if (action === "ARCHIVE") {
            toast.success(en ? "Notification archived." : "Notification archivée.");
          } else {
            toast.success(en ? "Notification marked as read." : "Notification marquée comme lue.");
          }
        },
        onError: () => {
          toast.error(
            en
              ? "The notification could not be updated."
              : "La notification n’a pas pu être mise à jour.",
          );
        },
      },
    );
  }

  function markEverythingRead() {
    markAll.mutate(undefined, {
      onSuccess: () => {
        toast.success(
          en ? "All notifications are marked as read." : "Toutes les notifications sont marquées comme lues.",
        );
      },
      onError: () => {
        toast.error(
          en
            ? "Notifications could not be updated."
            : "Les notifications n’ont pas pu être mises à jour.",
        );
      },
    });
  }

  if (query.isPending) {
    return <LoadingState label={en ? "Loading notifications…" : "Chargement des notifications…"} />;
  }

  if (query.isError) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={en ? "Notifications" : "Notifications"}
        description={
          en
            ? "Stay informed about account activity, transfers, security and bank services."
            : "Suivez l’activité de vos comptes, vos virements, la sécurité et les informations de votre banque."
        }
        action={
          query.data?.unreadCount ? (
            <Button
              variant="outline"
              loading={markAll.isPending}
              loadingLabel={en ? "Updating…" : "Mise à jour…"}
              onClick={markEverythingRead}
            >
              <CheckCheck aria-hidden className="mr-2 size-4" />
              {en ? "Mark all as read" : "Tout marquer comme lu"}
            </Button>
          ) : undefined
        }
      />

      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
          <SummaryItem
            icon="total"
            label={en ? "On this page" : "Sur cette page"}
            value={items.length}
          />
          <SummaryItem
            icon="unread"
            label={en ? "Unread notifications" : "Notifications non lues"}
            value={query.data?.unreadCount ?? 0}
          />
          <SummaryItem
            icon="priority"
            label={en ? "Priority alerts" : "Alertes prioritaires"}
            value={items.filter((item) => item.severity === "CRITICAL" || item.severity === "WARNING").length}
          />
        </CardContent>
      </Card>

      <section className="space-y-3" aria-label={en ? "Notification inbox" : "Centre de notifications"}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">
              {en ? "Your notification inbox" : "Votre centre de notifications"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {en
                ? "Search, filter and manage your banking alerts."
                : "Recherchez, filtrez et gérez vos alertes bancaires."}
            </p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                en
                  ? "Search notifications"
                  : "Rechercher dans les notifications"
              }
              aria-label={en ? "Search notifications" : "Rechercher des notifications"}
              className="pl-9"
            />
          </div>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label={en ? "Filter by category" : "Filtrer par catégorie"}
        >
          {FILTERS.map((item) => (
            <Button
              key={item.key}
              type="button"
              size="sm"
              className="shrink-0"
              variant={filter === item.key ? "default" : "outline"}
              aria-pressed={filter === item.key}
              onClick={() => selectCategory(item.key)}
            >
              {en ? item.labelEn : item.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label={en ? "Filter by read status" : "Filtrer par statut de lecture"}>
          {(["ALL", "UNREAD", "READ"] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={readFilter === value ? "secondary" : "ghost"}
              aria-pressed={readFilter === value}
              onClick={() => setReadFilter(value)}
            >
              {value === "ALL"
                ? en
                  ? "All statuses"
                  : "Tous les statuts"
                : value === "UNREAD"
                  ? en
                    ? "Unread"
                    : "Non lues"
                  : en
                    ? "Read"
                    : "Lues"}
            </Button>
          ))}
        </div>

        {items.length === 0 ? (
          <EmptyState
            title={en ? "You're all caught up" : "Vous êtes à jour"}
            description={
              en
                ? "New account, transfer and security alerts will appear here."
                : "Les nouvelles alertes de compte, de virement et de sécurité apparaîtront ici."
            }
          />
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title={en ? "No matching notification" : "Aucune notification correspondante"}
            description={
              en
                ? "Try another search or change the read-status filter."
                : "Essayez une autre recherche ou modifiez le filtre de lecture."
            }
          />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {visibleItems.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                en={en}
                onRead={() => changeNotification(notification.id, "READ")}
                onArchive={() => changeNotification(notification.id, "ARCHIVE")}
                updating={update.isPending}
              />
            ))}
          </div>
        )}

        {(query.data?.hasNext || history.length > 0) ? (
          <div className="flex justify-between gap-2 border-t border-border/70 pt-3">
            <Button
              variant="outline"
              disabled={!history.length || query.isFetching}
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
              disabled={!query.data?.hasNext || query.isFetching}
              onClick={() => {
                if (!query.data?.nextCursor) return;
                setHistory((items) => [...items, cursor ?? ""]);
                setCursor(query.data.nextCursor);
              }}
            >
              {en ? "Next" : "Suivant"}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: "total" | "unread" | "priority";
  label: string;
  value: number;
}) {
  const Icon =
    icon === "priority" ? ShieldAlert : icon === "unread" ? Bell : CheckCheck;

  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  en,
  onRead,
  onArchive,
  updating,
}: {
  notification: NotificationDto;
  en: boolean;
  onRead: () => void;
  onArchive: () => void;
  updating: boolean;
}) {
  const critical = notification.severity === "CRITICAL";
  const warning = notification.severity === "WARNING";
  const Icon = critical ? ShieldAlert : warning ? AlertTriangle : Bell;
  const category = en
    ? CATEGORY_LABEL_EN[notification.category] ?? notification.category
    : CATEGORY_LABELS[notification.category]?.fr ?? notification.category;
  const severity = SEVERITY_LABELS[notification.severity][en ? "en" : "fr"];

  return (
    <Card
      className={`group overflow-hidden motion-safe:transition-[border-color,box-shadow,transform] motion-safe:duration-200 hover:-translate-y-0.5 hover:shadow-md ${notification.readAt ? "" : "border-primary/30 bg-primary/[0.025]"}`}
    >
      <CardContent className="flex h-full flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${critical ? "bg-danger/10 text-danger" : warning ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
            <Icon aria-hidden className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 break-words text-sm font-semibold text-foreground">
                {notification.title}
              </h3>
              {!notification.readAt ? (
                <StatusBadge label={en ? "New" : "Nouveau"} tone="info" />
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={category} tone="neutral" />
              <StatusBadge
                label={severity}
                tone={SEVERITY_TONES[notification.severity]}
              />
            </div>
          </div>
        </div>

        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
          {notification.body}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
          <p className="text-xs text-muted-foreground">
            {formatDateTime(notification.createdAt)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {!notification.readAt ? (
              <Button
                size="sm"
                variant="outline"
                disabled={updating}
                onClick={onRead}
              >
                {en ? "Mark as read" : "Marquer comme lue"}
              </Button>
            ) : null}
            {notification.resourcePath ? (
              <Button size="sm" asChild>
                <Link to={notification.resourcePath as AppPath}>
                  {en ? "View details" : "Voir le détail"}
                </Link>
              </Button>
            ) : null}
            <Button
              size="icon"
              variant="ghost"
              disabled={updating}
              aria-label={en ? "Archive notification" : "Archiver la notification"}
              onClick={onArchive}
            >
              <Archive aria-hidden className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
