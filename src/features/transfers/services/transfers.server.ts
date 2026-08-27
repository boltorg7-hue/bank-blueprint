/**
 * Server-only transfer service (PROMPT 07 §64 – §135 ; PROMPT 08 §17 – §56).
 *
 * Reads use the request-scoped client (RLS as the customer). Every financial
 * command is a privileged SQL routine, revoked from signed-in roles, executed
 * through the trusted server client for a verified user id. The routine itself
 * classifies the destination (internal vs external), revalidates, reserves,
 * posts the balanced journal and moves the progress state. The client never
 * chooses a transfer kind and never sets a progress value.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ExternalSettlementState,
  TransferConfirmationResultDto,
  TransferDetailDto,
  TransferDocumentDto,
  TransferDto,
  TransferFailureCode,
  TransferKind,
  TransferLimitsDto,
  TransferProgressState,
  TransferRequirementDto,
  TransferStatus,
  TransferStatusEventDto,
} from "@/features/transfers/types/transfer";

type Client = SupabaseClient<any, any, any>;

export class TransferError extends Error {}

const KNOWN_CODES: readonly TransferFailureCode[] = [
  "INSUFFICIENT_FUNDS",
  "LIMIT_EXCEEDED",
  "ACCOUNT_RESTRICTED",
  "DESTINATION_UNAVAILABLE",
  "DESTINATION_NOT_SUPPORTED",
  "DESTINATION_IS_INTERNAL",
  "CURRENCY_MISMATCH",
  "BENEFICIARY_UNAVAILABLE",
  "SOURCE_ACCOUNT_UNAVAILABLE",
  "INVALID_AMOUNT",
  "INVALID_DESTINATION",
  "INVALID_TRANSITION",
  "TRANSFER_UNAVAILABLE",
  "SETTLEMENT_FAILED",
  "COMPLIANCE_REJECTED",
  "PROCESSING_ERROR",
];

function toDomainError(raw: unknown): TransferError {
  const message = String((raw as { message?: string } | null)?.message ?? "");
  const code = KNOWN_CODES.find((candidate) => message.includes(candidate));
  if (code) return new TransferError(code);
  if (message.includes("REQUIREMENT_NOT_OPEN")) return new TransferError("REQUIREMENT_NOT_OPEN");
  if (message.includes("REQUIREMENT_UNAVAILABLE"))
    return new TransferError("REQUIREMENT_UNAVAILABLE");
  if (message.includes("INVALID_DOCUMENT_PATH")) return new TransferError("INVALID_DOCUMENT_PATH");
  return new TransferError("UNEXPECTED_ERROR");
}

function asFailureCode(value: string | null): TransferFailureCode | null {
  if (!value) return null;
  return (KNOWN_CODES as readonly string[]).includes(value)
    ? (value as TransferFailureCode)
    : "UNEXPECTED_ERROR";
}

const COLUMNS = [
  "public_reference",
  "status",
  "transfer_kind",
  "progress_state",
  "progress_percent",
  "external_status",
  "hold_id",
  "amount_minor",
  "currency",
  "customer_reference",
  "recipient_display_snapshot",
  "destination_masked_snapshot",
  "source_masked_snapshot",
  "failure_code",
  "created_at",
  "confirmed_at",
  "completed_at",
  "finalized_at",
  "source_account:bank_accounts!transfers_source_account_id_fkey(public_reference, currency_minor_unit)",
  "beneficiary:beneficiaries!transfers_beneficiary_id_fkey(public_reference, external_bank_name, external_country)",
  "journal:ledger_transactions!transfers_ledger_transaction_id_fkey(public_reference)",
  "rail:external_settlement_rails!transfers_settlement_rail_id_fkey(is_simulation)",
].join(", ");

type Row = {
  public_reference: string;
  status: TransferStatus;
  transfer_kind: TransferKind;
  progress_state: TransferProgressState;
  progress_percent: number;
  external_status: ExternalSettlementState | null;
  hold_id: string | null;
  amount_minor: number | string;
  currency: string;
  customer_reference: string | null;
  recipient_display_snapshot: string;
  destination_masked_snapshot: string;
  source_masked_snapshot: string;
  failure_code: string | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  finalized_at: string | null;
  source_account: { public_reference: string; currency_minor_unit: number } | null;
  beneficiary: {
    public_reference: string;
    external_bank_name: string | null;
    external_country: string | null;
  } | null;
  journal: { public_reference: string } | null;
  rail: { is_simulation: boolean } | null;
};

const HOLD_RELEASED_STATUSES: readonly TransferStatus[] = [
  "COMPLETED",
  "FAILED",
  "REJECTED",
  "CANCELLED",
  "REVERSED",
];

function toDto(row: Row): TransferDto {
  return {
    reference: row.public_reference,
    status: row.status,
    kind: row.transfer_kind,
    progressState: row.progress_state,
    progressPercent: Number(row.progress_percent ?? 0),
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    minorUnit: row.source_account?.currency_minor_unit ?? 2,
    customerReference: row.customer_reference,
    recipientDisplay: row.recipient_display_snapshot,
    destinationMasked: row.destination_masked_snapshot,
    sourceMasked: row.source_masked_snapshot,
    sourceAccountReference: row.source_account?.public_reference ?? null,
    beneficiaryReference: row.beneficiary?.public_reference ?? null,
    destinationBankName: row.beneficiary?.external_bank_name ?? null,
    destinationCountry: row.beneficiary?.external_country ?? null,
    settlementState: row.external_status,
    settlementIsSimulated: Boolean(row.rail?.is_simulation),
    failureCode: asFailureCode(row.failure_code),
    fundsReserved: row.hold_id !== null && !HOLD_RELEASED_STATUSES.includes(row.status),
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    completedAt: row.completed_at,
    finalizedAt: row.finalized_at,
    transactionReference: row.journal?.public_reference ?? null,
  };
}

export async function listTransfers(
  client: Client,
  userId: string,
  limit = 30,
): Promise<TransferDto[]> {
  const { data, error } = await client
    .from("transfers")
    .select(COLUMNS)
    .eq("sender_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new TransferError("TRANSFERS_UNAVAILABLE");
  return ((data ?? []) as unknown as Row[]).map(toDto);
}

async function loadRequirements(
  client: Client,
  userId: string,
  reference: string,
): Promise<TransferRequirementDto[]> {
  const { data } = await client
    .from("transfer_requirements")
    .select(
      "id, requirement_type, title, description, status, is_mandatory, rejection_reason_code, requested_at, submitted_at, reviewed_at, transfers!inner(public_reference)",
    )
    .eq("user_id", userId)
    .eq("transfers.public_reference", reference)
    .order("requested_at", { ascending: true });

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id as string,
    requirementType: row.requirement_type,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status,
    isMandatory: Boolean(row.is_mandatory),
    rejectionReasonCode: (row.rejection_reason_code as string | null) ?? null,
    requestedAt: row.requested_at as string,
    submittedAt: (row.submitted_at as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
  }));
}

async function loadDocuments(
  client: Client,
  userId: string,
  reference: string,
): Promise<TransferDocumentDto[]> {
  // The storage path is deliberately never returned to the browser (§22, §97).
  const { data } = await client
    .from("transfer_documents")
    .select(
      "id, requirement_id, document_type, original_filename, status, rejection_reason_code, uploaded_at, reviewed_at, transfers!inner(public_reference)",
    )
    .eq("user_id", userId)
    .eq("transfers.public_reference", reference)
    .order("uploaded_at", { ascending: false });

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id as string,
    requirementId: (row.requirement_id as string | null) ?? null,
    documentType: row.document_type,
    originalFilename: (row.original_filename as string | null) ?? null,
    status: row.status,
    rejectionReasonCode: (row.rejection_reason_code as string | null) ?? null,
    uploadedAt: row.uploaded_at as string,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
  }));
}

export async function getTransferDetail(
  client: Client,
  userId: string,
  reference: string,
): Promise<TransferDetailDto | null> {
  const { data, error } = await client
    .from("transfers")
    .select(COLUMNS)
    .eq("sender_user_id", userId)
    .eq("public_reference", reference)
    .maybeSingle();
  if (error) throw new TransferError("TRANSFER_UNAVAILABLE");
  if (!data) return null;

  const dto = toDto(data as unknown as Row);

  const { data: history } = await client
    .from("transfer_status_history")
    .select("to_status, reason_code, created_at, transfers!inner(public_reference)")
    .eq("transfers.public_reference", reference)
    .order("created_at", { ascending: true });

  const timeline: TransferStatusEventDto[] = ((history ?? []) as any[]).map((row) => ({
    status: row.to_status as TransferStatus,
    reasonCode: (row.reason_code as string | null) ?? null,
    occurredAt: row.created_at as string,
  }));

  const [requirements, documents] = await Promise.all([
    loadRequirements(client, userId, reference),
    loadDocuments(client, userId, reference),
  ]);

  return { ...dto, timeline, requirements, documents };
}

export async function getTransferLimits(
  client: Client,
  currency: string,
): Promise<TransferLimitsDto | null> {
  const { data, error } = await client
    .from("transfer_limits")
    .select("currency, max_per_transfer_minor, daily_limit_minor, monthly_limit_minor")
    .eq("currency", currency)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as any;
  return {
    currency: row.currency as string,
    maxPerTransferMinor: Number(row.max_per_transfer_minor),
    dailyLimitMinor: Number(row.daily_limit_minor),
    monthlyLimitMinor: Number(row.monthly_limit_minor),
  };
}

/**
 * Creation. The routing decision belongs to the database routine: whatever the
 * browser believes about the destination is irrelevant (§17, §107).
 */
export async function createTransfer(
  client: Client,
  userId: string,
  input: {
    sourceAccountReference: string;
    beneficiaryReference: string;
    amountMinor: number;
    customerReference: string | null;
  },
): Promise<TransferDetailDto> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("create_customer_transfer", {
    _user_id: userId,
    _source_account_reference: input.sourceAccountReference,
    _beneficiary_reference: input.beneficiaryReference,
    _amount_minor: input.amountMinor,
    _customer_reference: input.customerReference,
  } as never);
  if (error) throw toDomainError(error);

  const reference = String(data ?? "");
  const detail = await getTransferDetail(client, userId, reference);
  if (!detail) throw new TransferError("TRANSFER_UNAVAILABLE");
  return detail;
}

/**
 * Atomic execution (§99 – §115 ; PROMPT 08 §2 – §8, §42 – §50).
 * Internal transfers post the two-sided journal and reach 100 %. External
 * transfers stop at the trusted state their workflow allows — never 100 %.
 * Retrying with the same reference is safe.
 */
export async function confirmTransfer(
  userId: string,
  reference: string,
): Promise<TransferConfirmationResultDto> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("confirm_customer_transfer", {
    _user_id: userId,
    _reference: reference,
  } as never);
  if (error) throw toDomainError(error);

  const row = (data as any[] | null)?.[0];
  if (!row) throw new TransferError("PROCESSING_ERROR");

  const status = row.status as TransferStatus;
  const result: TransferConfirmationResultDto = {
    reference,
    status,
    kind: "INTERNAL_TRANSFER",
    progressPercent: Number(row.progress_percent ?? 0),
    failureCode: asFailureCode((row.failure_code as string | null) ?? null),
    transactionReference: (row.transaction_reference as string | null) ?? null,
  };

  // An approved external transfer is handed to the settlement port straight
  // away; the port decides the next trusted state (§49, §51).
  if (status === "APPROVED") {
    await submitSettlement(userId, reference);
  }

  const { data: refreshed } = await supabaseAdmin
    .from("transfers")
    .select("status, transfer_kind, progress_percent, failure_code")
    .eq("public_reference", reference)
    .eq("sender_user_id", userId)
    .maybeSingle();

  if (refreshed) {
    const fresh = refreshed as any;
    return {
      ...result,
      status: fresh.status as TransferStatus,
      kind: fresh.transfer_kind as TransferKind,
      progressPercent: Number(fresh.progress_percent ?? result.progressPercent),
      failureCode: asFailureCode((fresh.failure_code as string | null) ?? null),
    };
  }
  return result;
}

export async function cancelTransfer(
  userId: string,
  reference: string,
): Promise<{ reference: string; status: TransferStatus }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("cancel_transfer", {
    _user_id: userId,
    _reference: reference,
  } as never);
  if (error) throw toDomainError(error);
  return { reference, status: (data as TransferStatus) ?? "CANCELLED" };
}

/** Registers a document the customer just uploaded to the private bucket (§35). */
export async function registerTransferDocument(
  client: Client,
  userId: string,
  input: {
    reference: string;
    requirementId: string;
    storagePath: string;
    originalFilename: string | null;
    mimeType: string | null;
    sizeBytes: number | null;
  },
): Promise<TransferDetailDto> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("submit_transfer_document", {
    _user_id: userId,
    _reference: input.reference,
    _requirement_id: input.requirementId,
    _storage_path: input.storagePath,
    _original_filename: input.originalFilename,
    _mime_type: input.mimeType,
    _size_bytes: input.sizeBytes,
  } as never);
  if (error) throw toDomainError(error);

  const detail = await getTransferDetail(client, userId, input.reference);
  if (!detail) throw new TransferError("TRANSFER_UNAVAILABLE");
  return detail;
}

type SettlementRow = {
  id: string;
  public_reference: string;
  amount_minor: number | string;
  currency: string;
  status: TransferStatus;
  external_provider_reference: string | null;
  rail: { provider_key: string } | null;
};

async function loadSettlementRow(
  admin: any,
  userId: string,
  reference: string,
): Promise<SettlementRow | null> {
  const { data } = await admin
    .from("transfers")
    .select(
      "id, public_reference, amount_minor, currency, status, external_provider_reference, rail:external_settlement_rails!transfers_settlement_rail_id_fkey(provider_key)",
    )
    .eq("public_reference", reference)
    .eq("sender_user_id", userId)
    .eq("transfer_kind", "EXTERNAL_TRANSFER")
    .maybeSingle();
  return (data as SettlementRow | null) ?? null;
}

/** Hands an approved external transfer to its configured rail (§51, §75). */
export async function submitSettlement(userId: string, reference: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const row = await loadSettlementRow(supabaseAdmin, userId, reference);
  if (!row || row.status !== "APPROVED") return;

  const { getSettlementProvider } = await import(
    "@/features/transfers/services/settlement/provider"
  );
  const provider = getSettlementProvider(row.rail?.provider_key ?? "");
  if (!provider) return;

  const outcome = await provider.submitTransfer({
    transferReference: row.public_reference,
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    idempotencyKey: `settlement:${row.id}`,
  });

  const { error } = await supabaseAdmin.rpc("submit_external_settlement", {
    _reference: reference,
  } as never);
  if (error) throw toDomainError(error);

  await supabaseAdmin.rpc("apply_external_settlement_result", {
    _reference: reference,
    _provider_status: outcome.state,
    _provider_reference: outcome.providerReference,
  } as never);
}

/**
 * Pulls the authoritative settlement status (§55). An unknown or pending result
 * never completes and never fails the transfer (§73, §106).
 */
export async function syncSettlement(
  client: Client,
  userId: string,
  reference: string,
): Promise<TransferDetailDto | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const row = await loadSettlementRow(supabaseAdmin, userId, reference);
  if (row && row.status === "SETTLEMENT_PENDING" && row.external_provider_reference) {
    const { getSettlementProvider } = await import(
      "@/features/transfers/services/settlement/provider"
    );
    const provider = getSettlementProvider(row.rail?.provider_key ?? "");
    if (provider) {
      const outcome = await provider.getTransferStatus(row.external_provider_reference);
      await supabaseAdmin.rpc("apply_external_settlement_result", {
        _reference: reference,
        _provider_status: outcome.state,
        _provider_reference: outcome.providerReference,
      } as never);
    }
  }
  return getTransferDetail(client, userId, reference);
}
