import { FileCheck2, Files, UserRoundCheck } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export function AdminOnboardingCases({ cases }: { cases: AdminOnboardingCaseDto[] }) {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <>
      <ul className="native-list divide-y divide-border md:hidden">
        {cases.map((item) => (
          <li key={item.customerId} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="font-semibold text-foreground">{item.fullName}</p><p className="mt-1 text-xs text-muted-foreground">{item.reference}</p></div>
              <CaseStatus status={item.verificationStatus} />
            </div>
            <p className="break-all text-sm text-muted-foreground">{item.email ?? (en ? "No email provided" : "E-mail non renseigné")}</p>
            <div className="grid grid-cols-2 gap-3 rounded-md bg-surface-sunken p-3">
              <div><p className="text-xs text-muted-foreground">{en ? "Documents" : "Documents"}</p><p className="mt-1 flex items-center gap-2 font-semibold"><Files className="size-4" />{item.documents.length}</p></div>
              <div><p className="text-xs text-muted-foreground">{en ? "Submitted" : "Soumis le"}</p><p className="mt-1 text-sm font-medium">{item.submittedAt ? formatDate(item.submittedAt) : "—"}</p></div>
              <div className="col-span-2"><p className="text-xs text-muted-foreground">{en ? "Decision date" : "Date de validation"}</p><p className="mt-1 text-sm font-medium">{item.decidedAt ? formatDateTime(item.decidedAt) : (en ? "Pending" : "En attente")}</p></div>
            </div>
            <DocumentList documents={item.documents} />
          </li>
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-md border border-border bg-surface md:block">
        <Table>
          <TableHeader><TableRow><TableHead>{en ? "Customer" : "Client"}</TableHead><TableHead>{en ? "Application status" : "Statut du dossier"}</TableHead><TableHead>{en ? "Documents received" : "Documents reçus"}</TableHead><TableHead>{en ? "Submitted" : "Soumission"}</TableHead><TableHead>{en ? "Decision date" : "Date de validation"}</TableHead></TableRow></TableHeader>
          <TableBody>{cases.map((item) => <TableRow key={item.customerId}>
            <TableCell><div className="flex gap-3"><UserRoundCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="font-medium">{item.fullName}</p><p className="text-xs text-muted-foreground">{item.reference}</p><p className="text-xs text-muted-foreground">{item.email ?? "—"}</p></div></div></TableCell>
            <TableCell><CaseStatus status={item.verificationStatus} /></TableCell>
            <TableCell><div className="flex items-center gap-2"><FileCheck2 className="size-4 text-muted-foreground" /><span className="font-medium">{item.documents.length}</span></div><div className="mt-2 max-w-sm"><DocumentList documents={item.documents} /></div></TableCell>
            <TableCell>{item.submittedAt ? formatDateTime(item.submittedAt) : "—"}</TableCell>
            <TableCell>{item.decidedAt ? formatDateTime(item.decidedAt) : <span className="text-muted-foreground">{en ? "Pending" : "En attente"}</span>}</TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </div>
    </>
  );
}