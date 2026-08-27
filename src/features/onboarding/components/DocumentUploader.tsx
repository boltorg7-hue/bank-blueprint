import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Trash2, UploadCloud } from "lucide-react";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const invalidate = useInvalidateCustomerContext();
  const register = useServerFn(registerDocument);
  const remove = useServerFn(removeDocument);
  const [documentType, setDocumentType] = useState<string>("IDENTITY_CARD");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("Formats acceptés : JPEG, PNG, HEIC, WEBP ou PDF.");
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError("Fichier trop volumineux (10 Mo maximum).");
      return;
    }

    setUploading(true);
    const { data: session } = await supabase.auth.getUser();
    const userId = session.user?.id;
    if (!userId) {
      setUploading(false);
      setError("Votre session a expiré. Reconnectez-vous pour continuer.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;

    const upload = await supabase.storage
      .from("identity-documents")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (upload.error) {
      setUploading(false);
      setError("L'envoi du document a échoué. Réessayez.");
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
    } catch {
      await supabase.storage.from("identity-documents").remove([storagePath]);
      setError("Nous n'avons pas pu enregistrer ce document. Réessayez.");
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
      setError("Ce document n'a pas pu être retiré.");
    } finally {
      setPendingRemoval(null);
    }
  }

  return (
    <div className="space-y-6">
      {editable ? (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Type de document</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type" className="touch-target">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {DOCUMENT_TYPE_LABELS[type]}
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
            Choisir un fichier
          </Button>
          <p className="text-caption text-muted-foreground">
            JPEG, PNG, HEIC, WEBP ou PDF — 10 Mo maximum. Vos documents sont stockés dans un espace
            privé et ne sont jamais publiés.
          </p>
          {error ? (
            <p role="alert" className="text-caption text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-label text-foreground">Documents envoyés</h2>
        {context.documents.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">Aucun document pour le moment.</p>
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
                    {DOCUMENT_TYPE_LABELS[document.document_type]}
                  </p>
                  <p className="text-caption truncate text-muted-foreground">
                    {document.original_filename ?? "Document"} ·{" "}
                    {DOCUMENT_STATUS_LABELS[document.status]}
                  </p>
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
                    <span className="sr-only">Retirer ce document</span>
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
