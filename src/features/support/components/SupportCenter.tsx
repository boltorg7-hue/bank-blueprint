import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSupportThread, useCustomerSupport, useReplySupportThread } from "@/features/support/hooks/useSupport";
import type { SupportCategory, SupportThreadDto } from "@/features/support/types/support";
import { formatDateTime } from "@/lib/format";

const categoryLabels: Record<SupportCategory, string> = { ACCOUNT: "Compte", TRANSFER: "Virement", DOCUMENT: "Document", SECURITY: "Sécurité", OTHER: "Autre demande" };

export function SupportCenter() {
  const query = useCustomerSupport();
  const create = useCreateSupportThread();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportCategory>("ACCOUNT");
  const [body, setBody] = useState("");

  async function submit() {
    if (subject.trim().length < 5 || !body.trim()) return toast.error("Ajoutez un sujet précis et votre message.");
    try { await create.mutateAsync({ subject, category, body }); setSubject(""); setBody(""); toast.success("Votre demande a été transmise au service client."); }
    catch { toast.error("La demande n’a pas pu être envoyée."); }
  }

  return <div className="space-y-6">
    <Card><CardHeader><CardTitle>Nouvelle demande</CardTitle></CardHeader><CardContent className="grid gap-4">
      <div className="grid gap-2"><Label htmlFor="support-category">Catégorie</Label><select id="support-category" className="h-10 rounded-md border bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as SupportCategory)}>{Object.entries(categoryLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="grid gap-2"><Label htmlFor="support-subject">Sujet</Label><Input id="support-subject" maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} /></div>
      <div className="grid gap-2"><Label htmlFor="support-body">Message</Label><Textarea id="support-body" rows={5} maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Ne communiquez jamais votre mot de passe, code PIN ou code de vérification." /></div>
      <Button className="w-fit" disabled={create.isPending} onClick={() => void submit()}>{create.isPending ? "Envoi…" : "Envoyer au service client"}</Button>
    </CardContent></Card>
    {query.isPending ? <LoadingState /> : query.isError ? <ErrorState onRetry={() => query.refetch()} /> : !query.data?.length ? <EmptyState title="Aucune demande" description="Vos échanges avec le service client apparaîtront ici." /> : query.data.map((thread) => <CustomerThread key={thread.id} thread={thread} />)}
  </div>;
}

function CustomerThread({ thread }: { thread: SupportThreadDto }) {
  const reply = useReplySupportThread(); const [body,setBody] = useState(""); const closed = ["CLOSED","RESOLVED"].includes(thread.status);
  async function send() { if (!body.trim()) return; try { await reply.mutateAsync({ threadId:thread.id,body }); setBody(""); toast.success("Réponse envoyée."); } catch { toast.error("Votre réponse n’a pas pu être envoyée."); } }
  return <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">{thread.subject}</CardTitle><StatusBadge label={thread.status} tone={closed ? "neutral" : thread.status === "WAITING_CUSTOMER" ? "info" : "pending"} /></div><p className="text-xs text-muted-foreground">{thread.reference} · {categoryLabels[thread.category]} · {formatDateTime(thread.lastMessageAt)}</p></CardHeader><CardContent className="space-y-4">
    <div className="space-y-3">{thread.messages.map((message) => <div key={message.id} className={`max-w-[90%] rounded-lg p-3 text-sm ${message.authorKind === "CUSTOMER" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}><div>{message.body}</div><div className="mt-1 text-xs opacity-70">{message.authorKind === "STAFF" ? "Service client" : "Vous"} · {formatDateTime(message.createdAt)}</div></div>)}</div>
    {!closed && <div className="flex gap-2"><Textarea aria-label="Répondre au service client" maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} /><Button disabled={reply.isPending} onClick={() => void send()}>Répondre</Button></div>}
  </CardContent></Card>;
}
