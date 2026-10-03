import { useLanguage } from "@/components/providers/LanguageProvider";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, FileText, Trash2, UploadCloud } from "lucide-react";
import { hasIdentityDocument, hasProofOfAddress } from "@/features/onboarding/lib/tasks";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  MAX_DOCUMENT_BYTES,
} from "@/features/onboarding/schemas/onboarding.schemas";
import {
  registerDocument,
  removeDocument,
} from "@/features/onboarding/services/onboarding.functions";
import {
  DOCUMENT_STATUS_LABELS,
  type CustomerContext,
} from "@/features/onboarding/types/customer-context";
import { useInvalidateCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";

const DOCUMENT_TYPE_LABELS_EN: Record<(typeof DOCUMENT_TYPES)[number], string> = {
  IDENTITY_CARD: "Identity card",
  PASSPORT: "Passport",
  RESIDENCE_PERMIT: "Residence permit",
  PROOF_OF_ADDRESS: "Proof of address",
  ADDITIONAL_DOCUMENT: "Additional document",
};

/**
 * Identity document upload (§41-§46).
 * Files go to a private storage area under the customer's own folder; the
 * document record is created by a server function, never by the browser.
 */
export function DocumentUploader({
  context,
  editable,
}: {
  context: CustomerContext;
  editable: boolean;
}) {
  const { language } = useLanguage();
  const en = language === "en";
  const inputRef = useRef<HTMLInputElement>(null);
  const invalidate = useInvalidateCustomerContext();
  const register = useServerFn(registerDocument);
  const remove = useServerFn(removeDocument);
  const [documentType, setDocumentType] = useState<string>("IDENTITY_CARD");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const idDone = hasIdentityDocument(context);
  const proofDone = hasProofOfAddress(context);
  const allDone = idDone && proofDone;

  // Pre-select the document still missing, so the customer never has to think about it.
  useEffect(() => {
    if (idDone && !proofDone) setDocumentType("PROOF_OF_ADDRESS");
    else if (!idDone && documentType === "PROOF_OF_ADDRESS" && proofDone) setDocumentType("IDENTITY_CARD");
  }, [idDone, proofDone]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFile(file: File) {
    setError(null);
    setUploadSuccess(null);

    if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError((en ? "Accepted formats: JPEG, PNG, HEIC, WEBP or PDF." : "Formats acceptés : JPEG, PNG, HEIC, WEBP ou PDF."));
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError((en ? "File too large (10 MB maximum)." : "Fichier trop volumineux (10 Mo maximum)."));
      return;
    }

    setUploading(true);
    const { data: session } = await supabase.auth.getUser();
    const userId = session.user?.id;
    if (!userId) {
      setUploading(false);
      setError((en ? "Your session has expired. Sign in to continue." : "Votre session a expiré. Reconnectez-vous pour continuer."));
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;

    const upload = await supabase.storage
      .from("identity-documents")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (upload.error) {
      setUploading(false);
      setError((en ? "The document could not be uploaded. Please try again." : "L'envoi du document a échoué. Réessayez."));
      return;
    }

    try {
      await register({
        data: {
          documentType,
          storagePath,
          originalFilename: file.name.slice(0, 255),
          mimeType: file.type,
          sizeBytes: file.size,
        },
      });
      await invalidate();
      setUploadSuccess(en ? "Document saved successfully." : "Document enregistré avec succès.");
    } catch {
      await supabase.storage.from("identity-documents").remove([storagePath]);
      setError((en ? "We could not save this document. Please try again." : "Nous n'avons pas pu enregistrer ce document. Réessayez."));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(documentId: string) {
    setPendingRemoval(documentId);
    try {
      await remove({ data: { documentId } });
      await invalidate();
    } catch {
      setError((en ? "This document could not be removed." : "Ce document n'a pas pu être retiré."));
    } finally {
      setPendingRemoval(null);
    }
  }

  return (
    <div className="space-y-6">
      <ul className="grid gap-2 sm:grid-cols-2" aria-label={en ? "Required documents" : "Documents requis"}>
        {[
          { done: idDone, label: en ? "Identity document" : "Pièce d'identité" },
          { done: proofDone, label: en ? "Proof of address" : "Justificatif de domicile" },
        ].map((slot) => (
          <li
            key={slot.label}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors duration-500 ${slot.done ? "border-success/40 bg-success-muted" : "border-border bg-surface"}`}
          >
            {slot.done ? (
              <CheckCircle2 className="size-5 shrink-0 text-success animate-in zoom-in-50 duration-500" aria-hidden="true" />
            ) : (
              <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <div>
              <p className="text-label text-foreground">{slot.label}</p>
              <p className="text-caption text-muted-foreground">
                {slot.done ? (en ? "Already provided" : "Déjà renseigné") : (en ? "To provide" : "À fournir")}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {editable && allDone ? (
        <p className="text-body-sm rounded-xl border border-border bg-surface px-4 py-3 text-muted-foreground">
          {en ? "Both documents are provided. You can still add or replace a document below." : "Les deux documents sont renseignés. Vous pouvez encore ajouter ou remplacer un document ci-dessous."}
        </p>
      ) : null}

      {editable ? (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">{en ? "Document type" : "Type de document"}</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type" className="touch-target">
                <SelectValue placeholder={en ? "Choose a type" : "Choisir un type"} />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {en ? DOCUMENT_TYPE_LABELS_EN[type] : DOCUMENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <input
            ref={inputRef}
            id="document-file"
            type="file"
            className="sr-only"
            accept={ALLOWED_DOCUMENT_MIME_TYPES.join(",")}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full touch-target"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="size-4" aria-hidden="true" />
            {en ? `Add: ${documentType === "PROOF_OF_ADDRESS" ? "proof of address" : "identity document"}` : `Ajouter : ${DOCUMENT_TYPE_LABELS[documentType as keyof typeof DOCUMENT_TYPE_LABELS]?.toLowerCase() ?? "document"}`}
          </Button>
          <p className="text-caption text-muted-foreground">
            {en ? "JPEG, PNG, HEIC, WEBP or PDF — 10 MB maximum. Your documents are stored privately and never published." : "JPEG, PNG, HEIC, WEBP ou PDF — 10 Mo maximum. Vos documents sont stockés dans un espace privé et ne sont jamais publiés."}
          </p>
          {error ? (
            <p role="alert" className="text-caption text-destructive">
              {error}
            </p>
          ) : null} : uploadSuccess ? (
            <p role="status" className="text-body-sm rounded-xl border border-success/40 bg-success-muted px-3 py-2 text-foreground">
              {uploadSuccess}
            </p>
          ) : null
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-label text-foreground">{en ? "Uploaded documents" : "Documents envoyés"}</h2>
        {context.documents.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">{en ? "No documents yet." : "Aucun document pour le moment."}</p>
        ) : (
          <ul className="space-y-2">
            {context.documents.map((document) => (
              <li
                key={document.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm text-foreground">
                    {en ? DOCUMENT_TYPE_LABELS_EN[document.document_type] : DOCUMENT_TYPE_LABELS[document.document_type]}
                  </p>
                  <p className="text-caption truncate text-muted-foreground">{document.original_filename ?? "Document"}</p>
                  <span className={`mt-1 inline-flex min-h-7 items-center rounded-full px-2.5 text-caption font-medium ${
                    document.status === "ACCEPTED" ? "bg-success-muted text-success" :
                    document.status === "ACTION_REQUIRED" || document.status === "REJECTED" || document.status === "EXPIRED" ? "bg-warning-muted text-warning" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {en ? document.status.replaceAll("_", " ").toLowerCase() : DOCUMENT_STATUS_LABELS[document.status]}
                  </span>
                  {document.rejection_reason ? (
                    <p className="text-caption mt-1 text-destructive">{document.rejection_reason}</p>
                  ) : null}
                </div>
                {editable ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    loading={pendingRemoval === document.id}
                    onClick={() => void handleRemove(document.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    <span className="sr-only">{en ? "Remove this document" : "Retirer ce document"}</span>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
