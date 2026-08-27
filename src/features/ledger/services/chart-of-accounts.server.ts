/**
 * Chart-of-accounts registry (§59 – §62).
 *
 * Feature code resolves ledger accounts by stable CODE — never by hardcoded
 * UUID. Privileged credentials, so server-only.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import {
  LedgerError,
  SYSTEM_LEDGER_ACCOUNTS,
  type LedgerAccountRef,
  type SystemLedgerAccountKey,
} from "@/features/ledger/types/ledger";

type Row = {
  id: string;
  code: string;
  currency: string;
  account_class: LedgerAccountRef["accountClass"];
  normal_side: LedgerAccountRef["normalSide"];
  status: LedgerAccountRef["status"];
};

function toRef(row: Row): LedgerAccountRef {
  return {
    id: row.id,
    code: row.code,
    currency: row.currency,
    accountClass: row.account_class,
    normalSide: row.normal_side,
    status: row.status,
  };
}

async function byCode(code: string): Promise<LedgerAccountRef> {
  const { data, error } = await supabaseAdmin
    .from("ledger_accounts")
    .select("id, code, currency, account_class, normal_side, status")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new LedgerError("ledger_unavailable", error.message);
  if (!data) throw new LedgerError("posting_validation_failed", `unknown ledger account ${code}`);
  return toRef(data as unknown as Row);
}

/** Resolves a system account for a currency, e.g. `FEE_REVENUE.TTD`. */
export function resolveSystemLedgerAccount(
  key: SystemLedgerAccountKey,
  currency: string,
): Promise<LedgerAccountRef> {
  return byCode(`${SYSTEM_LEDGER_ACCOUNTS[key]}.${currency}`);
}

/**
 * Resolves the customer deposit liability account linked to a bank account
 * (§10 – §12). Provisioned by trigger at account creation; ensured here for
 * safety, without ever creating money (§57).
 */
export async function resolveCustomerDepositLedgerAccount(
  bankAccountId: string,
): Promise<LedgerAccountRef> {
  const { data, error } = await supabaseAdmin
    .from("ledger_accounts")
    .select("id, code, currency, account_class, normal_side, status")
    .eq("bank_account_id", bankAccountId)
    .maybeSingle();
  if (error) throw new LedgerError("ledger_unavailable", error.message);
  if (data) return toRef(data as unknown as Row);

  const { error: provisionError } = await supabaseAdmin.rpc(
    "ensure_bank_account_ledger_account",
    { _bank_account_id: bankAccountId },
  );
  if (provisionError) throw new LedgerError("ledger_unavailable", provisionError.message);

  return resolveCustomerDepositLedgerAccount(bankAccountId);
}

/**
 * Integrity utility (§121 – §123): recomputes every account's ledger balance
 * from entries and compares it to the projection. Internal use only.
 */
export async function checkBalanceProjectionIntegrity(): Promise<
  { accountId: string; ledgerComputed: number; projectionValue: number; matches: boolean }[]
> {
  const { data, error } = await supabaseAdmin.rpc("check_balance_projection_integrity");
  if (error) throw new LedgerError("projection_failure", error.message);
  return ((data ?? []) as any[]).map((row) => ({
    accountId: row.account_id as string,
    ledgerComputed: Number(row.ledger_computed),
    projectionValue: Number(row.projection_value),
    matches: Boolean(row.matches),
  }));
}
