import { memo, useState } from "react";
import {
  Clock3,
  Inbox,
  MessageSquareText,
  Plus,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSupportThread,
  useCustomerSupport,
  useReplySupportThread,
} from "@/features/support/hooks/useSupport";
import type {
  SupportCategory,
  SupportStatus,
  SupportThreadDto,
} from "@/features/support/types/support";
import { formatDateTime } from "@/lib/format";

type ThreadFilter = "ALL" | SupportStatus;

const CATEGORY_LABELS: Record<SupportCategory, { fr: string; en: string }> = {
  ACCOUNT: { fr: "Compte", en: "Account" },
  TRANSFER: { fr: "Virement", en: "Transfer" },
  DOCUMENT: { fr: "Document", en: "Document" },
  SECURITY: { fr: "Sécurité", en: "Security" },
  OTHER: { fr: "Autre demande", en: "Other request" },
};

const STATUS_LABELS: Record<SupportStatus, { fr: string; en: string }> = {
  OPEN: { fr: "Ouverte", en: "Open" },
  WAITING_SUPPORT: { fr: "En attente du support", en: "Waiting for support" },
  WAITING_CUSTOMER: { fr: "Votre réponse attendue", en: "Your reply is needed" },
  RESOLVED: { fr: "Résolue", en: "Resolved" },
  CLOSED: { fr: "Clôturée", en: "Closed" },
};

const STATUS_TONES: Record<
  SupportStatus,
  "success" | "pending" | "neutral" | "info"
> = {
  OPEN: "pending",
  WAITING_SUPPORT: "pending",
  WAITING_CUSTOMER: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
};

const FILTERS: ThreadFilter[] = [
  "ALL",
  "WAITING_SUPPORT",
  "WAITING_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];

function statusLabel(status: SupportStatus, en: boolean) {
  return STATUS_LABELS[status][en ? "en" : "fr"];
}

function messagePreview(thread: SupportThreadDto) {
  return thread.messages[thread.messages.length - 1]?.body ?? thread.subject;
}

export function SupportCenter() {
  const { language } = useLanguage();
  const en = language === "en";
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ThreadFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportCategory>("ACCOUNT");
  const [body, setBody] = useState("");

  const query = useCustomerSupport(cursor);
  const create = useCreateSupportThread();
  const term = search.trim().toLocaleLowerCase();
  const threads = (query.data?.items ?? []).filter((thread) => {
    const matchesFilter = filter === "ALL" || thread.status === filter;
    const searchable = [
      thread.subject,
      thread.reference,
      CATEGORY_LABELS[thread.category][en ? "en" : "fr"],
      messagePreview(thread),
    ]
      .join(" ")
      .toLocaleLowerCase();
    return matchesFilter && (!term || searchable.includes(term));
  });
  const selectedThread =
    threads.find((thread) => thread.id === selectedId) ?? threads[0] ?? null;

  async function submit() {
    const cleanSubject = subject.trim();
    const cleanBody = body.trim();
    if (cleanSubject.length < 5 || !cleanBody) {
      toast.error(
        en
          ? "Add a clear subject and your message."
          : "Ajoutez un sujet précis et votre message.",
      );
      return;
    }

    try {
      await create.mutateAsync({
        subject: cleanSubject,
        category,
        body: cleanBody,
      });
      setSubject("");
      setBody("");
      setShowComposer(false);
      setFilter("ALL");
      setSearch("");
      setCursor(null);
      setHistory([]);
      toast.success(
        en
          ? "Your request was sent securely."
          : "Votre demande a été envoyée de manière sécurisée.",
      );
    } catch {
      toast.error(
        en
          ? "The request could not be sent. Please try again."
          : "La demande n’a pas pu être envoyée. Réessayez.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.10] via-card to-card">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquareText aria-hidden className="size-6" />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                {en ? "Your secure conversations" : "Vos conversations sécurisées"}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {en
                  ? "Contact your bank, follow each request and continue the conversation from one place."
                  : "Contactez votre banque, suivez chaque demande et poursuivez vos échanges depuis un seul espace."}
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <ShieldCheck aria-hidden className="size-4 text-primary" />
                <span>
                  {en
                    ? "Private messages visible only to you and authorized bank staff."
                    : "Messages privés accessibles uniquement à vous et au personnel bancaire autorisé."}
                </span>
              </div>
            </div>
          </div>
          <Button
            className="w-full shrink-0 sm:w-auto"
            onClick={() => setShowComposer((value) => !value)}
          >
            <Plus aria-hidden className="mr-2 size-4" />
            {showComposer
              ? en
                ? "Close form"
                : "Fermer le formulaire"
              : en
                ? "New request"
                : "Nouvelle demande"}
          </Button>
        </CardContent>
      </Card>

      {showComposer ? (
        <Card className="border-primary/20">
          <CardContent className="grid gap-4 p-4 sm:p-5">
            <div>
              <h3 className="font-semibold text-foreground">
                {en ? "Contact customer support" : "Contacter le service client"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {en
                  ? "Describe your request clearly. A support agent will reply in this conversation."
                  : "Décrivez clairement votre demande. Un conseiller vous répondra dans cette conversation."}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support-category">
                {en ? "Request category" : "Catégorie de la demande"}
              </Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as SupportCategory)}
              >
                <SelectTrigger id="support-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, labels]) => (
                    <SelectItem key={value} value={value}>
                      {labels[en ? "en" : "fr"]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support-subject">{en ? "Subject" : "Sujet"}</Label>
              <Input
                id="support-subject"
                maxLength={120}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={
                  en
                    ? "Example: Question about my account"
                    : "Exemple : Question concernant mon compte"
                }
              />
              <p className="text-right text-xs text-muted-foreground">
                {subject.length}/120
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support-body">
                {en ? "Your message" : "Votre message"}
              </Label>
              <Textarea
                id="support-body"
                rows={5}
                maxLength={4000}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={
                  en
                    ? "Explain what you need help with. Never share your password, PIN or verification code."
                    : "Expliquez votre besoin. Ne communiquez jamais votre mot de passe, code PIN ou code de vérification."
                }
              />
              <p className="text-right text-xs text-muted-foreground">
                {body.length}/4000
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowComposer(false)}>
                {en ? "Cancel" : "Annuler"}
              </Button>
              <Button
                className="w-full sm:w-auto"
                loading={create.isPending}
                loadingLabel={en ? "Sending…" : "Envoi…"}
                disabled={subject.trim().length < 5 || !body.trim()}
                onClick={() => void submit()}
              >
                <Send aria-hidden className="mr-2 size-4" />
                {en ? "Send securely" : "Envoyer en toute sécurité"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-3">
        <SummaryTile
          label={en ? "Conversations" : "Conversations"}
          value={query.data?.items.length ?? 0}
          icon="inbox"
        />
        <SummaryTile
          label={en ? "Awaiting your reply" : "Votre réponse attendue"}
          value={
            (query.data?.items ?? []).filter(
              (thread) => thread.status === "WAITING_CUSTOMER",
            ).length
          }
          icon="reply"
        />
        <SummaryTile
          label={en ? "In progress" : "En cours"}
          value={
            (query.data?.items ?? []).filter((thread) =>
              ["OPEN", "WAITING_SUPPORT"].includes(thread.status),
            ).length
          }
          icon="clock"
        />
      </div>

      <section
        className="space-y-3"
        aria-label={en ? "Support conversations" : "Conversations avec le service client"}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              {en ? "Conversation history" : "Historique des conversations"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {en
                ? "Select a conversation to read and reply."
                : "Sélectionnez une conversation pour la lire et y répondre."}
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
                  ? "Search by subject or reference"
                  : "Rechercher par sujet ou référence"
              }
              aria-label={en ? "Search conversations" : "Rechercher des conversations"}
              className="pl-9"
            />
          </div>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label={en ? "Filter conversations" : "Filtrer les conversations"}
        >
          {FILTERS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={filter === value ? "default" : "outline"}
              className="shrink-0"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value === "ALL"
                ? en
                  ? "All"
                  : "Toutes"
                : statusLabel(value, en)}
            </Button>
          ))}
        </div>

        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : !query.data?.items.length ? (
          <EmptyState
            title={en ? "No conversation yet" : "Aucune conversation pour le moment"}
            description={
              en
                ? "Start a secure request to contact your bank. Your replies will be grouped here."
                : "Créez une demande sécurisée pour contacter votre banque. Vos réponses seront regroupées ici."
            }
          />
        ) : threads.length === 0 ? (
          <EmptyState
            title={en ? "No matching conversation" : "Aucune conversation correspondante"}
            description={
              en
                ? "Change the search or select another status filter."
                : "Modifiez votre recherche ou choisissez un autre filtre de statut."
            }
          />
        ) : (
          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.5fr)]">
            <div
              className="min-w-0 space-y-2"
              aria-label={en ? "Conversation list" : "Liste des conversations"}
            >
              {threads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  en={en}
                  selected={selectedThread?.id === thread.id}
                  onSelect={() => setSelectedId(thread.id)}
                />
              ))}
            </div>
            {selectedThread ? (
              <CustomerThread
                key={selectedThread.id}
                thread={selectedThread}
                en={en}
              />
            ) : null}
          </div>
        )}

        {(history.length > 0 || query.data?.hasNext) &&
        !query.isPending &&
        !query.isError ? (
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
                setSelectedId(null);
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

function SummaryTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: "inbox" | "reply" | "clock";
}) {
  const Icon = icon === "inbox" ? Inbox : icon === "reply" ? MessageSquareText : Clock3;

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3 sm:p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
          <Icon aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const ThreadListItem = memo(function ThreadListItem({
  thread,
  en,
  selected,
  onSelect,
}: {
  thread: SupportThreadDto;
  en: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const latest = thread.messages[thread.messages.length - 1];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-xl border p-3 text-left motion-safe:transition-colors motion-safe:duration-150 ${selected ? "border-primary/40 bg-primary/[0.06] shadow-sm" : "border-border/70 bg-card hover:border-primary/25 hover:bg-muted/30"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">
          {thread.subject}
        </span>
        <StatusBadge
          label={statusLabel(thread.status, en)}
          tone={STATUS_TONES[thread.status]}
        />
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {messagePreview(thread)}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="font-mono">{thread.reference}</span>
        <span>{formatDateTime(latest?.createdAt ?? thread.lastMessageAt)}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {CATEGORY_LABELS[thread.category][en ? "en" : "fr"]}
      </p>
    </button>
  );
});

const CustomerThread = memo(function CustomerThread({
  thread,
  en,
}: {
  thread: SupportThreadDto;
  en: boolean;
}) {
  const reply = useReplySupportThread();
  const [body, setBody] = useState("");
  const closed = thread.status === "CLOSED" || thread.status === "RESOLVED";

  async function send() {
    const cleanBody = body.trim();
    if (!cleanBody) return;

    try {
      await reply.mutateAsync({ threadId: thread.id, body: cleanBody });
      setBody("");
      toast.success(en ? "Reply sent." : "Votre réponse a été envoyée.");
    } catch {
      toast.error(
        en
          ? "Your reply could not be sent."
          : "Votre réponse n’a pas pu être envoyée.",
      );
    }
  }

  return (
    <Card className="flex min-w-0 flex-col overflow-hidden">
      <div className="border-b border-border/70 bg-muted/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="break-words font-semibold text-foreground">
              {thread.subject}
            </h4>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {thread.reference}
            </p>
          </div>
          <StatusBadge
            label={statusLabel(thread.status, en)}
            tone={STATUS_TONES[thread.status]}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {CATEGORY_LABELS[thread.category][en ? "en" : "fr"]} ·{" "}
          {en ? "Last activity" : "Dernière activité"}{" "}
          {formatDateTime(thread.lastMessageAt)}
        </p>
      </div>
      <CardContent className="space-y-4 p-3 sm:p-4">
        <div
          className="max-h-[520px] min-h-36 space-y-3 overflow-y-auto pr-1"
          aria-label={en ? "Messages" : "Messages"}
        >
          {thread.messages.map((message) => {
            const customer = message.authorKind === "CUSTOMER";

            return (
              <div
                key={message.id}
                className={`flex ${customer ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] space-y-1 rounded-2xl px-3 py-2.5 text-sm sm:max-w-[85%] ${customer ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground"}`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p
                    className={`text-[10px] ${customer ? "text-primary-foreground/75" : "text-muted-foreground"}`}
                  >
                    {customer ? (en ? "You" : "Vous") : en ? "Customer support" : "Service client"}{" "}
                    · {formatDateTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {closed ? (
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
            {en
              ? "This conversation is closed. You can create a new request if you need further assistance."
              : "Cette conversation est clôturée. Vous pouvez créer une nouvelle demande si vous avez besoin d'aide supplémentaire."}
          </div>
        ) : (
          <div className="space-y-2 border-t border-border/70 pt-3">
            <Label htmlFor={`support-reply-${thread.id}`}>
              {en ? "Your reply" : "Votre réponse"}
            </Label>
            <Textarea
              id={`support-reply-${thread.id}`}
              rows={3}
              maxLength={4000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={
                en
                  ? "Write a message to customer support…"
                  : "Écrivez un message au service client…"
              }
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {en
                  ? "Do not share your password or verification codes."
                  : "Ne partagez pas votre mot de passe ni vos codes de vérification."}
              </p>
              <Button
                className="w-full sm:w-auto"
                disabled={!body.trim() || reply.isPending}
                loading={reply.isPending}
                loadingLabel={en ? "Sending…" : "Envoi…"}
                onClick={() => void send()}
              >
                <Send aria-hidden className="mr-2 size-4" />
                {en ? "Send reply" : "Envoyer la réponse"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
