import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useAdminSupport, useSetSupportStatus, useStaffReplySupportThread } from "@/features/support/hooks/useSupport";
import type { SupportStatus, SupportThreadDto } from "@/features/support/types/support";
import { formatDateTime } from "@/lib/format";

export function AdminSupportConsole() {
  const query=useAdminSupport();
  if(query.isPending)return <LoadingState />;
  if(query.isError)return <ErrorState onRetry={()=>query.refetch()} />;
  if(!query.data?.length)return <EmptyState title="Aucune demande client" />;
  return <div className="space-y-5">{query.data.map((thread)=><AdminThread key={thread.id} thread={thread}/>)}</div>;
}
function AdminThread({thread}:{thread:SupportThreadDto}) {
  const reply=useStaffReplySupportThread(); const status=useSetSupportStatus(); const [body,setBody]=useState("");
  async function send(){if(!body.trim())return;try{await reply.mutateAsync({threadId:thread.id,body});setBody("");toast.success("Réponse envoyée au client.");}catch{toast.error("La réponse n’a pas pu être envoyée.");}}
  async function change(next:SupportStatus){try{await status.mutateAsync({threadId:thread.id,status:next});toast.success("Statut mis à jour.");}catch{toast.error("Le statut n’a pas pu être modifié.");}}
  return <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">{thread.customerName} — {thread.subject}</CardTitle><StatusBadge label={thread.status} tone={thread.status==="CLOSED"||thread.status==="RESOLVED"?"neutral":"pending"}/></div><p className="text-xs text-muted-foreground">{thread.reference} · {thread.category} · {formatDateTime(thread.lastMessageAt)}</p></CardHeader><CardContent className="space-y-4">
    <div className="space-y-2">{thread.messages.map((message)=><div key={message.id} className={`rounded-lg p-3 text-sm ${message.authorKind==="STAFF"?"ml-8 bg-primary/10":"mr-8 bg-muted"}`}><strong>{message.authorKind==="STAFF"?"Service client":"Client"}</strong><p className="whitespace-pre-wrap">{message.body}</p><span className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</span></div>)}</div>
    {thread.status!=="CLOSED"&&<div className="space-y-2"><Textarea aria-label="Réponse au client" maxLength={4000} value={body} onChange={(event)=>setBody(event.target.value)}/><div className="flex flex-wrap gap-2"><Button disabled={reply.isPending} onClick={()=>void send()}>Répondre</Button><Button variant="outline" disabled={status.isPending} onClick={()=>void change("RESOLVED")}>Marquer résolu</Button><Button variant="outline" disabled={status.isPending} onClick={()=>void change("CLOSED")}>Clore</Button></div></div>}
  </CardContent></Card>;
}
