/**
 * Server-only account read model (§87, §89, §91, §165).
 *
 * Every function here receives the request-scoped Supabase client built from
 * the verified bearer token, so Row Level Security applies as the signed-in
 * customer. Ownership is therefore enforced twice: by RLS, and by the explicit
 * filters below.
 *
 * This module NEVER writes to balances. Balance mutation belongs to the ledger
 * engine (PROMPT 06) and to controlled admin operations (PROMPT 13).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AccountStatus,
  AccountType,
  CustomerAccountDetailsDto,
  CustomerAccountSummaryDto,
  DashboardSummaryDto,
  ActivitySummaryItemDto,
  MonthlySummaryDto,
} from "@/features/accounts/types/account";

export class AccountAccessError extends Error {}

/** Loosely typed client: the DTO mapping below is the real contract. */
type Client = SupabaseClient<any, any, any>;

const ACCOUNT_COLUMNS = [
  "public_reference",
  "display_name",
  "account_type",
  "currency",
  "currency_minor_unit",
  "status",
  "is_primary",
  "account_number",
  "bank_code",
  "branch_code",
  "bic",
  "iban",
  "opened_at",
  "closed_at",
].join(", ");

const BALANCE_COLUMNS =
  "account_id, currency, ledger_balance_minor, available_balance_minor, held_balance_minor, version, calculated_at";

type AccountRow = {
  public_reference: string;
  display_name: string;
  account_type: AccountType;
  currency: string;
  currency_minor_unit: number;
  status: AccountStatus;
  is_primary: boolean;
  account_number: string;
  bank_code: string | null;
  branch_code: string | null;
  bic: string | null;
  iban: string | null;
  opened_at: string | null;
  closed_at: string | null;
};

type BalanceRow = {
  currency: string;
  ledger_balance_minor: number;
  available_balance_minor: number;
  held_balance_minor: number;
  version: number;
  calculated_at: string;
};

function maskNumber(accountNumber: string): string {
  return accountNumber.slice(-4).padStart(4, "•");
}

function toSummary(row: AccountRow, balance: BalanceRow | null): CustomerAccountSummaryDto {
  return {
    reference: row.public_reference,
    displayName: row.display_name,
    accountType: row.account_type,
    currency: row.currency,
    minorUnit: row.currency_minor_unit,
    status: row.status,
    isPrimary: row.is_primary,
    maskedNumber: maskNumber(row.account_number),
    openedAt: row.opened_at,
    balance: balance
      ? {
          currency: balance.currency,
          minorUnit: row.currency_minor_unit,
          ledgerBalanceMinor: Number(balance.ledger_balance_minor),
          availableBalanceMinor: Number(balance.available_balance_minor),
          heldBalanceMinor: Number(balance.held_balance_minor),
          version: balance.version,
          calculatedAt: balance.calculated_at,
        }
      : null,
  };
}

/**
 * Idempotent initial provisioning (§32, §33). The provisioning routine is
 * privileged: it is not executable by signed-in sessions, so it runs through
 * the trusted server client only, for a user id already verified by the
 * authentication middleware. The database function still re-checks the ACTIVE
 * lifecycle and short-circuits when an account already exists.
 */
export async function ensurePrimaryAccount(_client: Client, userId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("provision_primary_account", {
    _user_id: userId,
  } as never);
  if (error) {
    // Provisioning issues must never leak infrastructure details (§112).
    throw new AccountAccessError("ACCOUNT_PROVISIONING_FAILED");
  }
}


async function fetchAccountRows(client: Client, userId: string): Promise<AccountRow[]> {
  const { data, error } = await client
    .from("bank_accounts")
    .select(ACCOUNT_COLUMNS)
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new AccountAccessError("ACCOUNTS_UNAVAILABLE");
  return (data ?? []) as unknown as AccountRow[];
}

async function fetchBalances(
  client: Client,
  references: string[],
): Promise<Map<string, BalanceRow>> {
  if (references.length === 0) return new Map();
  // Balances are joined through the owned accounts only (RLS enforces this too).
  const { data, error } = await client
    .from("account_balances")
    .select(`${BALANCE_COLUMNS}, bank_accounts!inner(public_reference)`);
  if (error) throw new AccountAccessError("BALANCES_UNAVAILABLE");

  const map = new Map<string, BalanceRow>();
  for (const row of (data ?? []) as any[]) {
    const reference = row.bank_accounts?.public_reference as string | undefined;
    if (reference && references.includes(reference)) map.set(reference, row as BalanceRow);
  }
  return map;
}

export async function loadCustomerAccounts(
  client: Client,
  userId: string,
): Promise<CustomerAccountSummaryDto[]> {
  const rows = await fetchAccountRows(client, userId);
  const balances = await fetchBalances(
    client,
    rows.map((row) => row.public_reference),
  );
  return rows.map((row) => toSummary(row, balances.get(row.public_reference) ?? null));
}

/**
 * Account details for a single reference. An account belonging to another
 * customer is indistinguishable from a non-existent one (§91).
 */
export async function loadAccountDetails(
  client: Client,
  userId: string,
  reference: string,
): Promise<CustomerAccountDetailsDto | null> {
  const { data, error } = await client
    .from("bank_accounts")
    .select(ACCOUNT_COLUMNS)
    .eq("user_id", userId)
    .eq("public_reference", reference)
    .maybeSingle();
  if (error) throw new AccountAccessError("ACCOUNT_UNAVAILABLE");
  if (!data) return null;

  const row = data as unknown as AccountRow;
  const balances = await fetchBalances(client, [row.public_reference]);
  const summary = toSummary(row, balances.get(row.public_reference) ?? null);

  const { data: profile } = await client
    .from("profiles")
    .select("first_name, middle_name, last_name")
    .eq("id", userId)
    .maybeSingle();

  const holderName =
    [profile?.first_name, profile?.middle_name, profile?.last_name]
      .filter(Boolean)
      .join(" ") || "Titulaire du compte";

  return {
    ...summary,
    holderName,
    closedAt: row.closed_at,
    coordinates: {
      accountNumber: row.account_number,
      bankCode: row.bank_code,
      branchCode: row.branch_code,
      bic: row.bic,
      iban: row.iban,
    },
  };
}

/**
 * Monthly aggregate (§60 – §66). The authoritative source is the ledger
 * (PROMPT 06): the figures come from a server-side aggregate over posted
 * entries. No value is ever computed or guessed on the client.
 */
async function currentMonthSummary(
  client: Client,
  account: CustomerAccountSummaryDto,
): Promise<MonthlySummaryDto> {
  const { getMonthlyActivitySummary } = await import(
    "@/features/transactions/services/transactions.server"
  );
  const now = new Date();
  const fallback: MonthlySummaryDto = {
    periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
    currency: account.currency,
    minorUnit: account.minorUnit,
    moneyInMinor: 0,
    moneyOutMinor: 0,
    netMinor: 0,
    ledgerAvailable: false,
  };

  try {
    const summary = await getMonthlyActivitySummary(
      client,
      account.reference,
      account.currency,
      account.minorUnit,
      now,
    );
    return {
      periodStart: summary.periodStart,
      periodEnd: summary.periodEnd,
      currency: summary.currency,
      minorUnit: summary.minorUnit,
      moneyInMinor: summary.moneyInMinor,
      moneyOutMinor: summary.moneyOutMinor,
      netMinor: summary.netMinor,
      ledgerAvailable: true,
    };
  } catch {
    // Degraded, explicitly flagged — never a fabricated figure (§33).
    return fallback;
  }
}

/**
 * Recent activity preview, read from the customer-safe ledger view (§67).
 */
async function recentActivityFor(
  client: Client,
  accountReference: string | null,
): Promise<ActivitySummaryItemDto[]> {
  if (!accountReference) return [];
  const { getAccountActivity } = await import(
    "@/features/transactions/services/transactions.server"
  );
  try {
    const items = await getAccountActivity(client, accountReference, 5);
    return items.map((item) => ({
      reference: item.reference,
      type: item.type,
      direction: item.direction === "INCOMING" ? "credit" : "debit",
      displayName: item.displayTitle,
      amountMinor: item.amountMinor,
      currency: item.currency,
      minorUnit: item.minorUnit,
      occurredAt: item.occurredAt,
      status:
        item.status === "COMPLETED"
          ? "POSTED"
          : item.status === "FAILED" || item.status === "CANCELLED"
            ? "FAILED"
            : "PENDING",
    }));
  } catch {
    return [];
  }
}

/**
 * Lean dashboard aggregate (§74, §75): account summaries, the balance
 * projection, the monthly contract and the recent-activity contract. No
 * documents, statements, beneficiaries or messages are included.
 */
export async function loadDashboardSummary(
  client: Client,
  userId: string,
  lifecycleState: string,
): Promise<DashboardSummaryDto> {
  if (lifecycleState === "ACTIVE") {
    await ensurePrimaryAccount(client, userId);
  }

  const accounts = await loadCustomerAccounts(client, userId);
  const primary = accounts.find((account) => account.isPrimary) ?? accounts[0] ?? null;

  const [recentActivity, monthlySummary] = await Promise.all([
    recentActivityFor(client, primary?.reference ?? null),
    primary ? currentMonthSummary(client, primary) : Promise.resolve(null),
  ]);

  return {
    accounts,
    primaryAccountReference: primary?.reference ?? null,
    recentActivity,
    monthlySummary,
    provisioningPending: lifecycleState === "ACTIVE" && accounts.length === 0,
  };
}

