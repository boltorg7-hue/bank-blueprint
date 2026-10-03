import { useLanguage } from "@/components/providers/LanguageProvider";
import { memo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSupportThread, useCustomerSupport, useReplySupportThread } from "@/features/support/hooks/useSupport";
import type { SupportCategory, SupportThreadDto } from "@/features/support/types/support";
import { formatDateTime } from "@/lib/format";

const categoryLabels: Record<SupportCategory, string> = { ACCOUNT: "Compte", TRANSFER: "Virement", DOCUMENT: "Document", SECURITY: "Sécurité", OTHER: "Autre demande" };

export function SupportCenter() {
  const { language } = useLanguage();
  const en = language === "en";
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const query = useCustomerSupport(cursor);
  const create = useCreateSupportThread();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportCategory>("ACCOUNT");
  const [body, setBody] = useState("");

  async function submit() {
    if (subject.trim().length < 5 || !body.trim()) return void toast.error((en ? "Add a clear subject and your message." : "Ajoutez un sujet précis et votre message."));
    try { await create.mutateAsync({ subject, category, body }); setSubject(""); setBody(""); toast.success((en ? "Your request was sent to customer support." : "Votre demande a été transmise au service client.")); }
    catch { toast.error((en ? "The request could not be sent." : "La demande n’a pas pu être envoyée.")); }
  }

  return <div className="space-y-6">
    <Card><CardHeader><CardTitle>{(en ? "New request" : "Nouvelle demande")}</CardTitle></CardHeader><CardContent className="grid gap-4">
      <div className="grid gap-2"><Label htmlFor="support-category">{(en ? "Category" : "Catégorie")}</Label><Select value={category} onValueChange={(value) => setCategory(value as SupportCategory)}><SelectTrigger id="support-category"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([value, label]) => <SelectItem key={value} value={value}>{en ? ({ ACCOUNT: "Account", TRANSFER: "Transfer", DOCUMENT: "Document", SECURITY: "Security", OTHER: "Other" } as Record<string,string>)[value] : label}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-2"><Label htmlFor="support-subject">{(en ? "Subject" : "Sujet")}</Label><Input id="support-subject" maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} /></div>
      <div className="grid gap-2"><Label htmlFor="support-body">Message</Label><Textarea id="support-body" rows={5} maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} placeholder={en ? "Never share your password, PIN or verification code." : "Ne communiquez jamais votre mot de passe, code PIN ou code de vérification."} /></div>
      <Button className="w-full sm:w-fit" loading={create.isPending} loadingLabel={en ? "Sending…" : "Envoi…"} onClick={() => void submit()}>{create.isPending ? (en ? "Sending…" : "Envoi…") : (en ? "Send to support" : "Envoyer au service client")}</Button>
    </CardContent></Card>
    {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !query.data?.items.length ? <EmptyState title={en ? "No support conversations" : "Aucune conversation de support"} description={en ? "Start a request above to contact customer support securely. Your conversations will appear here." : "Envoyez une demande ci-dessus pour contacter votre service client en toute sécurité. Vos échanges apparaîtront ici."} /> : <>
      {query.data.items.map((thread) => <CustomerThread key={thread.id} thread={thread} />)}
      {(history.length > 0 || query.data.hasNext) ? <div className="flex justify-end gap-2"><Button variant="outline" disabled={!history.length || query.isFetching} onClick={() => setHistory((items) => { const next = [...items]; setCursor(next.pop() || null); return next; })}>{en ? "Previous" : "Précédent"}</Button><Button variant="outline" disabled={!query.data.hasNext || query.isFetching} onClick={() => { if (!query.data.nextCursor) return; setHistory((items) => [...items, cursor ?? ""]); setCursor(query.data.nextCursor); }}>{en ? "Next" : "Suivant"}</Button></div> : null}
    </>}
  </div>;
}

const CustomerThread = memo(function CustomerThread({ thread }: { thread: SupportThreadDto }) {
  const { language } = useLanguage();
  const en = language === "en";
  const reply = useReplySupportThread(); const [body,setBody] = useState(""); const closed = ["CLOSED","RESOLVED"].includes(thread.status);
  async function send() { if (!body.trim()) return; try { await reply.mutateAsync({ threadId:thread.id,body }); setBody(""); toast.success((en ? "Reply sent." : "Réponse envoyée.")); } catch { toast.error((en ? "Your reply could not be sent." : "Votre réponse n’a pas pu être envoyée.")); } }
  return <Card className="motion-safe:transition-[box-shadow,border-color] motion-safe:duration-200 hover:shadow-sm"><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">{thread.subject}</CardTitle><StatusBadge label={en ? (({ OPEN: "Open", WAITING_STAFF: "Waiting for support", WAITING_CUSTOMER: "Waiting for customer", RESOLVED: "Resolved", CLOSED: "Closed" } as Record<string,string>)[thread.status] ?? thread.status) : thread.status} tone={closed ? "neutral" : thread.status === "WAITING_CUSTOMER" ? "info" : "pending"} /></div><p className="text-xs text-muted-foreground">{thread.reference} · {en ? ({ ACCOUNT: "Account", TRANSFER: "Transfer", DOCUMENT: "Document", SECURITY: "Security", OTHER: "Other" } as Record<string,string>)[thread.category] : categoryLabels[thread.category]} · {formatDateTime(thread.lastMessageAt)}</p></CardHeader><CardContent className="space-y-4">
    <div className="space-y-3">{thread.messages.map((message) => <div key={message.id} className={`max-w-[90%] rounded-lg p-3 text-sm ${message.authorKind === "CUSTOMER" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}><div>{message.body}</div><div className="mt-1 text-xs opacity-70">{message.authorKind === "STAFF" ? (en ? "Customer support" : "Service client") : (en ? "You" : "Vous")} · {formatDateTime(message.createdAt)}</div></div>)}</div>
    {!closed && <div className="flex flex-col gap-2 sm:flex-row sm:items-end"><Textarea aria-label={en ? "Reply to customer support" : "Répondre au service client"} maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} /><Button className="w-full sm:w-auto" loading={reply.isPending} loadingLabel={en ? "Sending…" : "Envoi…"} onClick={() => void send()}>{(en ? "Reply" : "Répondre")}</Button></div>}
  </CardContent></Card>;
}
