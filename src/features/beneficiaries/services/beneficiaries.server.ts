/**
 * Server-only beneficiary service (PROMPT 07 §11 – §26, §111 ; PROMPT 08 §61 – §64).
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
  SettlementRailDto,
} from "@/features/beneficiaries/types/beneficiary";

type Client = SupabaseClient<any, any, any>;

/** Domain error whose message is always a stable, customer-safe code (§112). */
export class BeneficiaryError extends Error {}

const KNOWN_CODES = new Set([
  "ACCOUNT_RESTRICTED",
  "DESTINATION_UNAVAILABLE",
  "DESTINATION_NOT_SUPPORTED",
  "DESTINATION_IS_INTERNAL",
  "BENEFICIARY_UNAVAILABLE",
  "INVALID_DESTINATION",
]);

function toDomainError(raw: unknown): BeneficiaryError {
  const message = String((raw as { message?: string } | null)?.message ?? "");
  const code = [...KNOWN_CODES].find((candidate) => message.includes(candidate));
  return new BeneficiaryError(code ?? "UNEXPECTED_ERROR");
}

const COLUMNS =
  "public_reference, beneficiary_type, display_name, nickname, destination_account_masked, destination_currency, status, external_bank_name, external_country, last_used_at, created_at";

type Row = {
  public_reference: string;
  beneficiary_type: string;
  display_name: string;
  nickname: string | null;
  destination_account_masked: string;
  destination_currency: string;
  status: BeneficiaryStatus;
  external_bank_name: string | null;
  external_country: string | null;
  last_used_at: string | null;
  created_at: string;
};

function toDto(row: Row): BeneficiaryDto {
  const isExternal = row.beneficiary_type === "EXTERNAL_BANK";
  return {
    reference: row.public_reference,
    kind: isExternal ? "EXTERNAL" : "INTERNAL",
    displayName: row.display_name,
    nickname: row.nickname,
    maskedNumber: row.destination_account_masked,
    currency: row.destination_currency,
    status: row.status,
    bankName: isExternal ? row.external_bank_name : null,
    country: isExternal ? row.external_country : null,
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

/** Destinations the bank can actually reach today (§20, §62). */
export async function listSettlementRails(client: Client): Promise<SettlementRailDto[]> {
  const { data, error } = await client
    .from("external_settlement_rails")
    .select("code, display_name, country, currency, is_simulation")
    .eq("is_active", true)
    .order("display_name", { ascending: true });
  if (error) return [];
  return ((data ?? []) as any[]).map((row) => ({
    code: row.code as string,
    displayName: row.display_name as string,
    country: row.country as string,
    currency: row.currency as string,
    isSimulated: Boolean(row.is_simulation),
  }));
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

/**
 * External destination. The routine refuses an account held with us: such a
 * destination must stay an internal transfer (§19, §63).
 */
export async function createExternalBeneficiary(
  client: Client,
  userId: string,
  input: {
    displayName: string;
    bankName: string;
    identifier: string;
    country: string;
    currency: string;
    routingCode: string | null;
    nickname: string | null;
  },
): Promise<BeneficiaryDto> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("create_external_beneficiary", {
    _user_id: userId,
    _display_name: input.displayName,
    _bank_name: input.bankName,
    _account_identifier: input.identifier,
    _country: input.country,
    _currency: input.currency,
    _routing_code: input.routingCode,
    _nickname: input.nickname,
  } as never);
  if (error) throw toDomainError(error);

  const list = await listBeneficiaries(client, userId);
  const created = list.find((item) => item.kind === "EXTERNAL") ?? list[0];
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
