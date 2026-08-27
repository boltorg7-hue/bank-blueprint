/**
 * Posting boundary (§21 – §25, §108, §116, §117).
 *
 * This is the ONLY place in the application that creates financial movements.
 * It runs with privileged credentials, so it must never be reachable from the
 * browser: business domains (transfers, fees, adjustments) call it from their
 * own trusted server code after authorising the operation.
 *
 * The database function `post_ledger_transaction` performs the authoritative
 * validation (balance, currency, positive amounts, active accounts,
 * idempotency) inside a single PostgreSQL transaction, then refreshes the
 * balance projection. TypeScript validation here is a fast pre-check only.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import {
  LedgerError,
  type HoldRequest,
  type PostingRequest,
  type PostingResult,
} from "@/features/ledger/types/ledger";

const MAX_SAFE_MINOR = Number.MAX_SAFE_INTEGER;

function assertAmount(amountMinor: number): void {
  if (
    !Number.isInteger(amountMinor) ||
    amountMinor <= 0 ||
    amountMinor > MAX_SAFE_MINOR
  ) {
    // Zero and negative amounts are rejected outright (§26, §27, §31).
    throw new LedgerError("posting_validation_failed", "invalid amount");
  }
}

function validate(request: PostingRequest): void {
  if (!/^[A-Z]{3}$/.test(request.currency)) {
    throw new LedgerError("posting_validation_failed", "invalid currency");
  }
  if (request.idempotencyKey.trim().length < 8) {
    throw new LedgerError("posting_validation_failed", "weak idempotency key");
  }
  if (request.entries.length < 2) {
    throw new LedgerError("posting_validation_failed", "journal needs two lines");
  }

  let debits = 0;
  let credits = 0;
  for (const entry of request.entries) {
    assertAmount(entry.amountMinor);
    if (entry.side === "DEBIT") debits += entry.amountMinor;
    else credits += entry.amountMinor;
  }
  if (debits !== credits) {
    throw new LedgerError("ledger_unbalanced", `debits ${debits} <> credits ${credits}`);
  }
}

function mapDatabaseError(message: string): LedgerError {
  const text = message.toLowerCase();
  if (text.includes("unbalanced")) return new LedgerError("ledger_unbalanced", message);
  if (text.includes("currency")) return new LedgerError("currency_mismatch", message);
  if (text.includes("insufficient")) return new LedgerError("insufficient_funds", message);
  if (text.includes("duplicate")) return new LedgerError("duplicate_operation", message);
  return new LedgerError("posting_validation_failed", message);
}

/** Posts a balanced journal atomically and refreshes affected projections. */
export async function postLedgerTransaction(
  request: PostingRequest,
): Promise<PostingResult> {
  validate(request);

  const { data, error } = await supabaseAdmin.rpc("post_ledger_transaction", {
    _transaction_type: request.transactionType,
    _currency: request.currency,
    _description: request.description,
    _source_type: request.sourceType,
    _source_reference: request.sourceReference ?? null,
    _idempotency_key: request.idempotencyKey,
    _entries: request.entries.map((entry) => ({
      ledgerAccountId: entry.ledgerAccountId,
      side: entry.side,
      amountMinor: entry.amountMinor,
      ...(entry.description ? { description: entry.description } : {}),
    })),
    _created_by: request.createdBy ?? null,
    _metadata: request.metadata ?? {},
    _reversal_of: null,
  } as never);

  if (error) throw mapDatabaseError(error.message);

  const row = (Array.isArray(data) ? data[0] : data) as
    | { id: string; public_reference: string; already_posted: boolean }
    | undefined;
  if (!row) throw new LedgerError("projection_failure", "posting returned no result");

  return {
    transactionId: row.id,
    reference: row.public_reference,
    alreadyPosted: row.already_posted,
  };
}

/** Full reversal: a new balanced journal, the original stays intact (§69 – §73). */
export async function reverseLedgerTransaction(
  transactionId: string,
  reason: string,
  createdBy?: string | null,
): Promise<PostingResult> {
  const { data, error } = await supabaseAdmin.rpc("reverse_ledger_transaction", {
    _transaction_id: transactionId,
    _reason: reason,
    _created_by: createdBy ?? null,
  } as never);
  if (error) throw mapDatabaseError(error.message);

  const row = (Array.isArray(data) ? data[0] : data) as
    | { id: string; public_reference: string; already_posted: boolean }
    | undefined;
  if (!row) throw new LedgerError("projection_failure", "reversal returned no result");

  return {
    transactionId: row.id,
    reference: row.public_reference,
    alreadyPosted: row.already_posted,
  };
}

/** Reservation of funds: affects availability, not the booked balance (§50 – §55). */
export async function createAccountHold(request: HoldRequest): Promise<string> {
  assertAmount(request.amountMinor);
  const { data, error } = await supabaseAdmin.rpc("create_account_hold", {
    _account_id: request.accountId,
    _amount_minor: request.amountMinor,
    _reason_type: request.reasonType,
    _source_reference: request.sourceReference ?? null,
    _idempotency_key: request.idempotencyKey,
    _expires_at: request.expiresAt ?? null,
  } as never);
  if (error) throw mapDatabaseError(error.message);
  return data as unknown as string;
}

export async function releaseAccountHold(holdId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("release_account_hold", { _hold_id: holdId });
  if (error) throw mapDatabaseError(error.message);
}

export async function captureAccountHold(holdId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("capture_account_hold", { _hold_id: holdId });
  if (error) throw mapDatabaseError(error.message);
}
