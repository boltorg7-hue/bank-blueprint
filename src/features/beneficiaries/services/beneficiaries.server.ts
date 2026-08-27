/**
 * Server-only beneficiary service (PROMPT 07 §11 – §26, §111).
 *
 * Reads go through the request-scoped client (RLS applies as the customer).
 * Every write is a privileged database command: the SQL functions are revoked
 * from signed-in roles, so they run through the trusted server client only,
 * for a user id already verified by the authentication middleware.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  BeneficiaryDto,
  BeneficiaryStatus,
  ResolvedDestinationDto,
} from "@/features/beneficiaries/types/beneficiary";

type Client = SupabaseClient<any, any, any>;

/** Domain error whose message is always a stable, customer-safe code (§112). */
export class BeneficiaryError extends Error {}

const KNOWN_CODES = new Set([
  "ACCOUNT_RESTRICTED",
  "DESTINATION_UNAVAILABLE",
  "BENEFICIARY_UNAVAILABLE",
]);

function toDomainError(raw: unknown): BeneficiaryError {
  const message = String((raw as { message?: string } | null)?.message ?? "");
  const code = [...KNOWN_CODES].find((candidate) => message.includes(candidate));
  return new BeneficiaryError(code ?? "UNEXPECTED_ERROR");
}

const COLUMNS =
  "public_reference, display_name, nickname, destination_account_masked, destination_currency, status, last_used_at, created_at";

type Row = {
  public_reference: string;
  display_name: string;
  nickname: string | null;
  destination_account_masked: string;
  destination_currency: string;
  status: BeneficiaryStatus;
  last_used_at: string | null;
  created_at: string;
};

function toDto(row: Row): BeneficiaryDto {
  return {
    reference: row.public_reference,
    displayName: row.display_name,
    nickname: row.nickname,
    maskedNumber: row.destination_account_masked,
    currency: row.destination_currency,
    status: row.status,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
  };
}

export async function listBeneficiaries(
  client: Client,
  userId: string,
): Promise<BeneficiaryDto[]> {
  const { data, error } = await client
    .from("beneficiaries")
    .select(COLUMNS)
    .eq("user_id", userId)
    .neq("status", "REMOVED")
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new BeneficiaryError("BENEFICIARIES_UNAVAILABLE");
  return ((data ?? []) as unknown as Row[]).map(toDto);
}

export async function resolveDestination(
  userId: string,
  identifier: string,
): Promise<ResolvedDestinationDto | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("resolve_internal_destination", {
    _user_id: userId,
    _identifier: identifier,
  } as never);
  if (error) throw toDomainError(error);

  const row = (data as any[] | null)?.[0];
  if (!row) return null;
  return {
    displayName: row.display_name as string,
    maskedNumber: row.masked_number as string,
    currency: row.currency as string,
    isOwnAccount: Boolean(row.is_own_account),
  };
}

export async function createBeneficiary(
  client: Client,
  userId: string,
  identifier: string,
  nickname: string | null,
): Promise<BeneficiaryDto> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("create_internal_beneficiary", {
    _user_id: userId,
    _identifier: identifier,
    _nickname: nickname,
  } as never);
  if (error) throw toDomainError(error);

  const list = await listBeneficiaries(client, userId);
  const created = list[0];
  if (!created) throw new BeneficiaryError("UNEXPECTED_ERROR");
  return created;
}

export async function removeBeneficiary(userId: string, reference: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("remove_beneficiary", {
    _user_id: userId,
    _reference: reference,
  } as never);
  if (error) throw toDomainError(error);
}

export async function renameBeneficiary(
  userId: string,
  reference: string,
  nickname: string | null,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("rename_beneficiary", {
    _user_id: userId,
    _reference: reference,
    _nickname: nickname,
  } as never);
  if (error) throw toDomainError(error);
}
