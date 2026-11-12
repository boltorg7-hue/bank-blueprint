import type { SupabaseClient } from "@supabase/supabase-js";

import { requireAdminPermission } from "@/features/admin/services/admin.server";
import type {
  AdminTransferDocumentDto,
  AdminTransferDocumentReviewHistoryDto,
} from "@/features/admin/types/transfer-document-review";

type Client = SupabaseClient;

type TransferRow = {
  id: string;
  public_reference: string;
};

type DocumentRow = {
  id: string;
  transfer_id: string;
  requirement_id: string | null;
  document_type: string;
  original_filename: string | null;
  status: string;
  rejection_reason_code: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
};

type ReviewHistoryRow = {
  id: string;
  document_id: string;
  actor_user_id: string;
  previous_status: string;
  new_status: string;
  decision: string;
  reason_code: string | null;
  created_at: string;
};

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as SupabaseClient;
}

export async function loadTransferDocumentsForReferences(
  client: Client,
  references: string[],
): Promise<Map<string, AdminTransferDocumentDto[]>> {
  const result = new Map<string, AdminTransferDocumentDto[]>();
  const staff = await requireAdminPermission(client);
  if (!staff.permissions.includes("compliance.review") || references.length === 0) {
    return result;
  }

  const admin = await getAdminClient();
  const { data: transferData, error: transferError } = await admin
    .from("transfers")
    .select("id,public_reference")
    .eq("transfer_kind", "EXTERNAL_TRANSFER")
    .in("public_reference", references);
  if (transferError) throw new Error("TRANSFER_DOCUMENTS_UNAVAILABLE");

  const transfers = (transferData ?? []) as unknown as TransferRow[];
  const transferReferenceById = new Map(
    transfers.map((transfer) => [transfer.id, transfer.public_reference]),
  );
  const transferIds = transfers.map((transfer) => transfer.id);
  if (transferIds.length === 0) return result;

  const { data: documentData, error: documentError } = await admin
    .from("transfer_documents")
    .select(
      "id,transfer_id,requirement_id,document_type,original_filename,status,rejection_reason_code,uploaded_at,reviewed_at",
    )
    .in("transfer_id", transferIds)
    .order("uploaded_at", { ascending: false });
  if (documentError) throw new Error("TRANSFER_DOCUMENTS_UNAVAILABLE");

  const documents = (documentData ?? []) as unknown as DocumentRow[];
  const documentIds = documents.map((document) => document.id);
  const { data: historyData, error: historyError } = documentIds.length
    ? await admin
        .from("transfer_document_review_history")
        .select(
          "id,document_id,actor_user_id,previous_status,new_status,decision,reason_code,created_at",
        )
        .in("document_id", documentIds)
        .order("created_at", { ascending: false })
    : { data: [] as ReviewHistoryRow[], error: null };
  if (historyError) throw new Error("TRANSFER_DOCUMENT_HISTORY_UNAVAILABLE");

  const history = (historyData ?? []) as unknown as ReviewHistoryRow[];
  const actorIds = [...new Set(history.map((entry) => entry.actor_user_id))];
  const { data: actorData, error: actorError } = actorIds.length
    ? await admin
        .from("staff_profiles")
        .select("user_id,display_name")
        .in("user_id", actorIds)
    : { data: [] as Array<{ user_id: string; display_name: string | null }>, error: null };
  if (actorError) throw new Error("TRANSFER_DOCUMENT_HISTORY_UNAVAILABLE");

  const actorNames = new Map(
    (actorData ?? []).map((actor) => [actor.user_id, actor.display_name ?? "Agent"]),
  );
  const historyByDocument = new Map<string, AdminTransferDocumentReviewHistoryDto[]>();
  for (const entry of history) {
    const rows = historyByDocument.get(entry.document_id) ?? [];
    rows.push({
      id: entry.id,
      actorName: actorNames.get(entry.actor_user_id) ?? "Agent",
      decision: entry.decision as "ACCEPT" | "REQUEST_REPLACEMENT",
      previousStatus: entry.previous_status,
      newStatus: entry.new_status,
      reasonCode: entry.reason_code,
      createdAt: entry.created_at,
    });
    historyByDocument.set(entry.document_id, rows);
  }

  for (const document of documents) {
    const reference = transferReferenceById.get(document.transfer_id);
    if (!reference) continue;
    const rows = result.get(reference) ?? [];
    rows.push({
      id: document.id,
      requirementId: document.requirement_id,
      documentType: document.document_type,
      originalFilename: document.original_filename,
      status: document.status,
      rejectionReasonCode: document.rejection_reason_code,
      uploadedAt: document.uploaded_at,
      reviewedAt: document.reviewed_at,
      history: historyByDocument.get(document.id) ?? [],
    });
    result.set(reference, rows);
  }

  return result;
}

async function loadAuthorizedExternalDocument(client: Client, documentId: string) {
  await requireAdminPermission(client, "compliance.review");
  const admin = await getAdminClient();
  const { data: document, error } = await admin
    .from("transfer_documents")
    .select("id,transfer_id,user_id,storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (error || !document) throw new Error("TRANSFER_DOCUMENT_UNAVAILABLE");

  const { data: transfer, error: transferError } = await admin
    .from("transfers")
    .select("transfer_kind,sender_user_id")
    .eq("id", document.transfer_id)
    .maybeSingle();
  if (
    transferError ||
    !transfer ||
    transfer.transfer_kind !== "EXTERNAL_TRANSFER" ||
    transfer.sender_user_id !== document.user_id
  ) {
    throw new Error("TRANSFER_DOCUMENT_UNAVAILABLE");
  }

  return { admin, document };
}

export async function createAdminTransferDocumentUrl(
  client: Client,
  documentId: string,
): Promise<{ url: string; expiresInSeconds: number }> {
  const { admin, document } = await loadAuthorizedExternalDocument(client, documentId);
  const { data, error } = await admin.storage
    .from("transfer-documents")
    .createSignedUrl(document.storage_path, 60);
  if (error || !data?.signedUrl) throw new Error("TRANSFER_DOCUMENT_UNAVAILABLE");
  return { url: data.signedUrl, expiresInSeconds: 60 };
}

export async function reviewAdminTransferDocument(
  client: Client,
  actorUserId: string,
  input: {
    documentId: string;
    accept: boolean;
    reason: string;
  },
): Promise<{ ok: true }> {
  const { admin } = await loadAuthorizedExternalDocument(client, input.documentId);
  const { error } = await admin.rpc("review_transfer_document", {
    _staff_id: actorUserId,
    _document_id: input.documentId,
    _accept: input.accept,
    _reason_code: input.accept ? null : input.reason,
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already finalized")) throw new Error("DOCUMENT_ALREADY_FINALIZED");
    if (message.includes("not authorised")) throw new Error("ADMIN_FORBIDDEN");
    if (message.includes("reason required")) throw new Error("DOCUMENT_REJECTION_REASON_REQUIRED");
    throw new Error("TRANSFER_DOCUMENT_REVIEW_FAILED");
  }
  return { ok: true };
}
