/**
 * Server-only transfer service (PROMPT 07 §64 – §135).
 *
 * Reads use the request-scoped client (RLS as the customer). Every financial
 * command is a privileged SQL routine, revoked from signed-in roles, executed
 * through the trusted server client for a verified user id. The routine itself
 * performs the atomic sequence: revalidation → hold → balanced ledger journal
 * → hold capture → status transition.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  TransferConfirmationResultDto,
  TransferDetailDto,
  TransferDto,
  TransferFailureCode,
  TransferLimitsDto,
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
  "CURRENCY_MISMATCH",
  "BENEFICIARY_UNAVAILABLE",
  "SOURCE_ACCOUNT_UNAVAILABLE",
  "INVALID_AMOUNT",
  "INVALID_TRANSITION",
  "TRANSFER_UNAVAILABLE",
  "PROCESSING_ERROR",
];

function toDomainError(raw: unknown): TransferError {
  const message = String((raw as { message?: string } | null)?.message ?? "");
  const code = KNOWN_CODES.find((candidate) => message.includes(candidate));
  return new TransferError(code ?? "UNEXPECTED_ERROR");
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
  "source_account:bank_accounts!transfers_source_account_id_fkey(public_reference, currency_minor_unit)",
  "beneficiary:beneficiaries!transfers_beneficiary_id_fkey(public_reference)",
  "journal:ledger_transactions!transfers_ledger_transaction_id_fkey(public_reference)",
].join(", ");

type Row = {
  public_reference: string;
  status: TransferStatus;
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
  source_account: { public_reference: string; currency_minor_unit: number } | null;
  beneficiary: { public_reference: string } | null;
  journal: { public_reference: string } | null;
};

function toDto(row: Row): TransferDto {
  return {
    reference: row.public_reference,
    status: row.status,
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    minorUnit: row.source_account?.currency_minor_unit ?? 2,
    customerReference: row.customer_reference,
    recipientDisplay: row.recipient_display_snapshot,
    destinationMasked: row.destination_masked_snapshot,
    sourceMasked: row.source_masked_snapshot,
    sourceAccountReference: row.source_account?.public_reference ?? null,
    beneficiaryReference: row.beneficiary?.public_reference ?? null,
    failureCode: asFailureCode(row.failure_code),
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    completedAt: row.completed_at,
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

  return { ...dto, timeline };
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
  const { data, error } = await supabaseAdmin.rpc("create_internal_transfer", {
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
 * Atomic execution (§99 – §115). Retrying with the same transfer reference is
 * safe: the routine resolves to the already-posted financial result instead of
 * creating a second movement.
 */
export async function confirmTransfer(
  userId: string,
  reference: string,
): Promise<TransferConfirmationResultDto> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("confirm_internal_transfer", {
    _user_id: userId,
    _reference: reference,
  } as never);
  if (error) throw toDomainError(error);

  const row = (data as any[] | null)?.[0];
  if (!row) throw new TransferError("PROCESSING_ERROR");
  return {
    reference,
    status: row.status as TransferStatus,
    failureCode: asFailureCode((row.failure_code as string | null) ?? null),
    transactionReference: (row.transaction_reference as string | null) ?? null,
  };
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
