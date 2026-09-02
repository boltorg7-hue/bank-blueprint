/**
 * Customer document centre DTOs (PROMPT 09 §55 – §62).
 *
 * Storage paths never reach the browser (§5, §65): a document is identified by
 * its public reference, and access is granted through a short-lived authorised
 * URL issued server-side (§66, §67).
 */
import type { DocumentLifecycleStatus } from "@/features/statements/types/statement";

export type CustomerDocumentType =
  | "ACCOUNT_STATEMENT"
  | "TRANSFER_RECEIPT"
  | "TRANSACTION_RECEIPT"
  | "BANK_LETTER"
  | "ACCOUNT_CERTIFICATE";

export type CustomerDocumentDto = {
  /** Opaque public reference, e.g. DOC-2026-00018492. */
  reference: string;
  documentType: CustomerDocumentType;
  title: string;
  status: DocumentLifecycleStatus;
  /** STATEMENT | TRANSFER | TRANSACTION — the originating banking object (§85). */
  sourceType: string;
  sourceReference: string | null;
  accountReference: string | null;
  fileName: string | null;
  mimeType: string;
  sizeBytes: number | null;
  version: number;
  generatedAt: string | null;
  createdAt: string;
};

/** Short-lived authorised download (§66). */
export type DocumentDownloadDto = {
  url: string;
  fileName: string;
  expiresInSeconds: number;
};

export type DocumentFilter = "ALL" | "STATEMENTS" | "RECEIPTS" | "LETTERS";

export const DOCUMENT_REFERENCE_PATTERN = /^DOC-\d{4}-\d{8}$/;

export const DOCUMENT_TYPE_LABELS: Record<CustomerDocumentType, string> = {
  ACCOUNT_STATEMENT: "Relevé de compte",
  TRANSFER_RECEIPT: "Reçu de virement",
  TRANSACTION_RECEIPT: "Reçu d'opération",
  BANK_LETTER: "Courrier bancaire",
  ACCOUNT_CERTIFICATE: "Attestation de compte",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentLifecycleStatus, string> = {
  GENERATING: "En préparation",
  READY: "Disponible",
  FAILED: "Échec",
  SUPERSEDED: "Remplacé",
};

export function documentTypesForFilter(
  filter: DocumentFilter,
): CustomerDocumentType[] | null {
  switch (filter) {
    case "STATEMENTS":
      return ["ACCOUNT_STATEMENT"];
    case "RECEIPTS":
      return ["TRANSFER_RECEIPT", "TRANSACTION_RECEIPT"];
    case "LETTERS":
      return ["BANK_LETTER", "ACCOUNT_CERTIFICATE"];
    default:
      return null;
  }
}

/** Customer-facing failure codes for receipts (§76, §78, §81). */
export const DOCUMENT_ERROR_MESSAGES: Record<string, string> = {
  RECEIPT_NOT_AVAILABLE:
    "Le reçu définitif sera disponible dès la confirmation complète de l'opération.",
  RECEIPT_NOT_SUPPORTED: "Ce type de document ne peut pas être généré.",
  TRANSFER_UNAVAILABLE: "Ce virement n'est pas disponible.",
  TRANSACTION_UNAVAILABLE: "Cette opération n'est pas disponible.",
  DOCUMENT_UNAVAILABLE: "Ce document n'est pas disponible.",
  DOCUMENT_FILE_UNAVAILABLE: "Document momentanément indisponible. Réessayez.",
  GENERATION_FAILED: "Nous n'avons pas pu générer ce document. Réessayez.",
  UNEXPECTED_ERROR: "Nous n'avons pas pu générer ce document. Réessayez.",
};

export function documentErrorMessage(code: string | null | undefined): string {
  return DOCUMENT_ERROR_MESSAGES[code ?? ""] ?? DOCUMENT_ERROR_MESSAGES["UNEXPECTED_ERROR"]!;
}
