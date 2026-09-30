import { useState } from "react";
import { FileCheck2, Files, ShieldCheck, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useActivateAdminOnboardingCustomer, useAdminContext, useDecideAdminOnboardingCase, useReviewAdminOnboardingCase } from "@/features/admin/hooks/useAdmin";
import type { AdminOnboardingCaseDto } from "@/features/admin/types/admin";
import { formatDate, formatDateTime } from "@/lib/format";

const STATUS_LABELS: Record<string, { fr: string; en: string; tone: StatusTone }> = {
  NOT_STARTED: { fr: "Non commencé", en: "Not started", tone: "neutral" },
  IN_PROGRESS: { fr: "En cours", en: "In progress", tone: "info" },
  SUBMITTED: { fr: "Dossier transmis", en: "Submitted", tone: "pending" },
  UNDER_REVIEW: { fr: "En vérification", en: "Under review", tone: "info" },
  ADDITIONAL_INFORMATION_REQUIRED: { fr: "Complément requis", en: "More information required", tone: "pending" },
  VERIFIED: { fr: "Identité validée", en: "Identity verified", tone: "success" },
  REJECTED: { fr: "Refusé", en: "Rejected", tone: "failed" },
  EXPIRED: { fr: "Expiré", en: "Expired", tone: "failed" },
};

const DOCUMENT_LABELS: Record<string, { fr: string; en: string }> = {
  IDENTITY_CARD: { fr: "Carte d’identité", en: "Identity card" },
  PASSPORT: { fr: "Passeport", en: "Passport" },
  RESIDENCE_PERMIT: { fr: "Titre de séjour", en: "Residence permit" },
  PROOF_OF_ADDRESS: { fr: "Justificatif de domicile", en: "Proof of address" },
  ADDITIONAL_DOCUMENT: { fr: "Document complémentaire", en: "Additional document" },
};

const DOCUMENT_STATUS: Record<string, { fr: string; en: string; tone: StatusTone }> = {
  UPLOADED: { fr: "Reçu", en: "Received", tone: "info" },
  UNDER_REVIEW: { fr: "En vérification", en: "Under review", tone: "pending" },
  ACCEPTED: { fr: "Accepté", en: "Accepted", tone: "success" },
  ACTION_REQUIRED: { fr: "Action requise", en: "Action required", tone: "pending" },
  REJECTED: { fr: "Refusé", en: "Rejected", tone: "failed" },
  EXPIRED: { fr: "Expiré", en: "Expired", tone: "failed" },
};

const STEP_PROGRESS: Record<string, number> = {
  NOT_STARTED: 0,
  CONTACT: 10,
  PERSONAL_DETAILS: 25,
  ADDRESS: 50,
  IDENTITY: 65,
  DOCUMENTS: 75,
  REVIEW: 90,
  COMPLETED: 100,
};

function CaseStatus({ status }: { status: string }) {
  const { language } = useLanguage();
  const value = STATUS_LABELS[status] ?? { fr: status, en: status, tone: "neutral" as const };
  return <StatusBadge label={language === "en" ? value.en : value.fr} tone={value.tone} />;
}

function DocumentList({ documents }: { documents: AdminOnboardingCaseDto["documents"] }) {
  const { language } = useLanguage();
  const en = language === "en";
  if (!documents.length) return <p className="text-sm text-muted-foreground">{en ? "No document received" : "Aucun document reçu"}</p>;
  return (
    <ul className="space-y-2">
      {documents.map((document, index) => {
        const label = DOCUMENT_LABELS[document.type];
        const state = DOCUMENT_STATUS[document.status] ?? { fr: document.status, en: document.status, tone: "neutral" as const };
        return (
          <li key={`${document.type}-${index}`} className="flex min-w-0 items-start justify-between gap-3 rounded-md bg-surface-sunken p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{label ? (en ? label.en : label.fr) : document.type}</p>
              <p className="mt-1 text-xs text-muted-foreground">{en ? "Received" : "Reçu le"} {formatDate(document.receivedAt)}</p>
            </div>
            <StatusBadge label={en ? state.en : state.fr} tone={state.tone} />
          </li>
        );
      })}
    </ul>
  );
}

function Progress({ step }: { step: string }) {
  const { language } = useLanguage();
  const progress = STEP_PROGRESS[step] ?? 0;
  return (
    <div className="mt-2 min-w-36">
      <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{language === "en" ? "Progress" : "Progression"}</span><span>{progress}%</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

export function AdminOnboardingCases({ cases }: { cases: AdminOnboardingCaseDto[] }) {
  const { language } = useLanguage();
  const en = language === "en";
  const context = useAdminContext();
  const review = useReviewAdminOnboardingCase();
  const decide = useDecideAdminOnboardingCase();
  const activate = useActivateAdminOnboardingCustomer();
  const permissions = context.data?.permissions ?? [];
  const [action, setAction] = useState<{ item: AdminOnboardingCaseDto; type: "APPROVE" | "REJECT" | "REQUEST_INFO" | "CONFIRM" | "RETURN" | "ACTIVATE" } | null>(null);
  const [note, setNote] = useState("");

  function actions(item: AdminOnboardingCaseDto) {
    const pending = item.approval?.status === "PENDING_SECOND_REVIEW";
    return <div className="grid gap-2 sm:flex sm:flex-wrap">
      {permissions.includes("kyc.review") && ["SUBMITTED", "UNDER_REVIEW"].includes(item.verificationStatus) && !pending ? <>
        <Button size="sm" onClick={() => setAction({ item, type: "APPROVE" })}>{en ? "Recommend approval" : "Recommander l’approbation"}</Button>
        <Button size="sm" variant="outline" onClick={() => setAction({ item, type: "REQUEST_INFO" })}>{en ? "Request information" : "Demander un complément"}</Button>
        <Button size="sm" variant="ghost" onClick={() => setAction({ item, type: "REJECT" })}>{en ? "Recommend rejection" : "Recommander le refus"}</Button>
      </> : null}
      {permissions.includes("kyc.approve") && pending ? <>
        <Button size="sm" onClick={() => setAction({ item, type: "CONFIRM" })}>{en ? "Second approval" : "Seconde validation"}</Button>
        <Button size="sm" variant="outline" onClick={() => setAction({ item, type: "RETURN" })}>{en ? "Return to review" : "Renvoyer à l’examen"}</Button>
      </> : null}
      {permissions.includes("accounts.manage") && item.verificationStatus === "VERIFIED" && item.accountStatus === "PENDING" ? <Button size="sm" onClick={() => setAction({ item, type: "ACTIVATE" })}>{en ? "Activate banking" : "Activer le compte"}</Button> : null}
    </div>;
  }

  async function confirmAction() {
    if (!action || note.trim().length < 8) return;
    try {
      let result;
      if (["APPROVE", "REJECT", "REQUEST_INFO"].includes(action.type)) result = await review.mutateAsync({ customerId: action.item.customerId, recommendation: action.type as "APPROVE" | "REJECT" | "REQUEST_INFO", note: note.trim() });
      else if (action.type === "ACTIVATE") await activate.mutateAsync({ customerId: action.item.customerId, reason: note.trim() });
      else if (action.item.approval) result = await decide.mutateAsync({ requestId: action.item.approval.id, confirm: action.type === "CONFIRM", note: note.trim() });
      if (result && !result.ok) {
        const messages = {
          APPROVAL_ALREADY_PENDING: en ? "This application is already awaiting a supervisor." : "Ce dossier attend déjà la validation d’un superviseur.",
          MAKER_CANNOT_APPROVE: en ? "The first reviewer cannot perform the second approval." : "Le premier examinateur ne peut pas effectuer la seconde validation.",
          DECISION_ALREADY_RECORDED: en ? "This decision was already recorded. The list has been refreshed." : "Cette décision a déjà été enregistrée. La liste a été actualisée.",
          APPLICATION_STATE_CHANGED: en ? "The application changed before this decision. The list has been refreshed." : "Le dossier a changé avant cette décision. La liste a été actualisée.",
        } as const;
        toast.error(messages[result.code]);
        setAction(null); setNote("");
        return;
      }
      toast.success(en ? "Decision recorded." : "Décision enregistrée."); setAction(null); setNote("");
    } catch (error) {
      toast.error(error instanceof Error && error.message.includes("MAKER") ? (en ? "The first reviewer cannot perform the second approval." : "Le premier examinateur ne peut pas effectuer la seconde validation.") : (en ? "The decision could not be recorded." : "La décision n’a pas pu être enregistrée."));
    }
  }
  return (
    <>
      <ul className="native-list divide-y divide-border md:hidden">
        {cases.map((item) => (
          <li key={item.customerId} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="font-semibold text-foreground">{item.fullName}</p><p className="mt-1 text-xs text-muted-foreground">{item.reference}</p></div>
              <CaseStatus status={item.verificationStatus} />
            </div>
            <Progress step={item.onboardingStep} />
            <p className="break-all text-sm text-muted-foreground">{item.email ?? (en ? "No email provided" : "E-mail non renseigné")}</p>
            <div className="grid grid-cols-2 gap-3 rounded-md bg-surface-sunken p-3">
              <div><p className="text-xs text-muted-foreground">{en ? "Documents" : "Documents"}</p><p className="mt-1 flex items-center gap-2 font-semibold"><Files className="size-4" />{item.documents.length}</p></div>
              <div><p className="text-xs text-muted-foreground">{en ? "Submitted" : "Soumis le"}</p><p className="mt-1 text-sm font-medium">{item.submittedAt ? formatDate(item.submittedAt) : "—"}</p></div>
              <div className="col-span-2"><p className="text-xs text-muted-foreground">{en ? "Decision date" : "Date de validation"}</p><p className="mt-1 text-sm font-medium">{item.decidedAt ? formatDateTime(item.decidedAt) : (en ? "Pending" : "En attente")}</p></div>
            </div>
            <DocumentList documents={item.documents} />
            {item.approval ? <div className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">{en ? "First review" : "Premier examen"}</p><p className="mt-1 text-sm font-medium">{item.approval.reviewerName} · {item.approval.recommendation === "APPROVE" ? (en ? "Approval recommended" : "Approbation recommandée") : (en ? "Rejection recommended" : "Refus recommandé")}</p><p className="mt-1 text-sm text-muted-foreground">{item.approval.reviewerNote}</p></div> : null}
            {actions(item)}
          </li>
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-md border border-border bg-surface md:block">
        <Table>
        <TableHeader><TableRow><TableHead>{en ? "Customer" : "Client"}</TableHead><TableHead>{en ? "Application status" : "Statut du dossier"}</TableHead><TableHead>{en ? "Documents received" : "Documents reçus"}</TableHead><TableHead>{en ? "Review" : "Examen"}</TableHead><TableHead>{en ? "Action" : "Action"}</TableHead></TableRow></TableHeader>
          <TableBody>{cases.map((item) => <TableRow key={item.customerId}>
            <TableCell><div className="flex gap-3"><UserRoundCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="font-medium">{item.fullName}</p><p className="text-xs text-muted-foreground">{item.reference}</p><p className="text-xs text-muted-foreground">{item.email ?? "—"}</p></div></div></TableCell>
            <TableCell><CaseStatus status={item.verificationStatus} /><Progress step={item.onboardingStep} /></TableCell>
            <TableCell><div className="flex items-center gap-2"><FileCheck2 className="size-4 text-muted-foreground" /><span className="font-medium">{item.documents.length}</span></div><div className="mt-2 max-w-sm"><DocumentList documents={item.documents} /></div></TableCell>
            <TableCell>{item.approval ? <div><p className="font-medium">{item.approval.reviewerName}</p><p className="text-xs text-muted-foreground">{item.approval.recommendation === "APPROVE" ? (en ? "Approval recommended" : "Approbation recommandée") : (en ? "Rejection recommended" : "Refus recommandé")}</p></div> : item.submittedAt ? formatDateTime(item.submittedAt) : "—"}</TableCell>
            <TableCell><div className="min-w-56">{actions(item)}</div></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </div>
      <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open) { setAction(null); setNote(""); } }}><DialogContent className="w-[calc(100%-2rem)] rounded-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />{en ? "Confirm this decision" : "Confirmer cette décision"}</DialogTitle><DialogDescription>{action?.type === "CONFIRM" ? (en ? "You are the second reviewer. The first reviewer cannot confirm their own recommendation." : "Vous êtes le second examinateur. Le premier ne peut pas confirmer sa propre recommandation.") : (en ? "Record a clear, auditable reason before continuing." : "Consignez un motif clair et traçable avant de continuer.")}</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="onboarding-decision-note">{en ? "Decision note" : "Motif de la décision"}</Label><Textarea id="onboarding-decision-note" value={note} onChange={(event) => setNote(event.target.value)} minLength={8} maxLength={500} autoFocus /></div><DialogFooter className="gap-2"><Button variant="outline" onClick={() => setAction(null)}>{en ? "Cancel" : "Annuler"}</Button><Button onClick={() => void confirmAction()} disabled={note.trim().length < 8 || review.isPending || decide.isPending || activate.isPending}>{en ? "Confirm" : "Confirmer"}</Button></DialogFooter></DialogContent></Dialog>
    </>
  );
}