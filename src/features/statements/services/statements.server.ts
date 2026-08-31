/**
 * Statement read model + generation pipeline (PROMPT 09 §7 – §54).
 *
 * Server-only. The pipeline is strictly ordered (§44 – §49):
 *   1. issue  → the database freezes a reconciled snapshot (GENERATING)
 *   2. render → the PDF is produced from that snapshot only
 *   3. store  → private bucket, path never exposed to the browser
 *   4. finalize → the statement and its document become READY
 * Any failure marks the statement FAILED with a customer-safe code; a partial
 * document is never presented as available.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import type {
  StatementDetailDto,
  StatementDto,
  StatementGenerationRequest,
} from "@/features/statements/types/statement";
import type { StatementSnapshot } from "@/features/statements/templates/statement-pdf.server";

export const DOCUMENT_BUCKET = "customer-documents";

type Client = SupabaseClient<Database>;

type StatementRow = {
  public_reference: string;
  period_kind: string;
  period_start: string;
  period_end: string;
  currency: string;
  minor_unit: number;
  opening_balance_minor: number;
  closing_balance_minor: number;
  total_credit_minor: number;
  total_debit_minor: number;
  transaction_count: number;
  status: string;
  version: number;
  generated_at: string | null;
  failure_code: string | null;
  created_at: string;
  snapshot: unknown;
  bank_accounts: { public_reference: string; display_name: string } | null;
  customer_documents: { public_reference: string } | null;
};

const LIST_SELECT = `
  public_reference, period_kind, period_start, period_end, currency, minor_unit,
  opening_balance_minor, closing_balance_minor, total_credit_minor, total_debit_minor,
  transaction_count, status, version, generated_at, failure_code, created_at, snapshot,
  bank_accounts:account_id ( public_reference, display_name ),
  customer_documents:document_id ( public_reference )
`;

function snapshotOf(row: StatementRow): StatementSnapshot {
  return (row.snapshot ?? {}) as StatementSnapshot;
}

function toStatementDto(row: StatementRow): StatementDto {
  const snapshot = snapshotOf(row);
  return {
    reference: row.public_reference,
    accountReference: row.bank_accounts?.public_reference ?? snapshot.accountReference ?? "",
    accountDisplayName:
      row.bank_accounts?.display_name ?? snapshot.accountDisplayName ?? "Compte",
    periodKind: row.period_kind as StatementDto["periodKind"],
    periodStart: row.period_start,
    periodEnd: row.period_end,
    currency: row.currency,
    minorUnit: row.minor_unit,
    openingBalanceMinor: Number(row.opening_balance_minor),
    closingBalanceMinor: Number(row.closing_balance_minor),
    totalCreditMinor: Number(row.total_credit_minor),
    totalDebitMinor: Number(row.total_debit_minor),
    transactionCount: Number(row.transaction_count),
    status: row.status as StatementDto["status"],
    version: row.version,
    generatedAt: row.generated_at,
    documentReference: row.customer_documents?.public_reference ?? null,
    failureCode: row.failure_code,
    createdAt: row.created_at,
  };
}

function toStatementDetailDto(row: StatementRow): StatementDetailDto {
  const snapshot = snapshotOf(row);
  return {
    ...toStatementDto(row),
    holderName: snapshot.holderName ?? "Titulaire du compte",
    accountMaskedNumber: snapshot.accountMaskedNumber ?? "••••",
    iban: snapshot.iban ?? null,
    bic: snapshot.bic ?? null,
    lines: (snapshot.lines ?? []).map((line) => ({
      reference: line.reference,
      occurredAt: line.occurredAt,
      description: line.description,
      direction: line.direction,
      amountMinor: Number(line.amountMinor),
      balanceMinor: Number(line.balanceMinor),
    })),
  };
}

export async function listStatements(
  client: Client,
  userId: string,
  limit = 24,
): Promise<StatementDto[]> {
  const { data, error } = await client
    .from("account_statements")
    .select(LIST_SELECT)
    .eq("user_id", userId)
    .order("period_end", { ascending: false })
    .limit(limit);
  if (error) throw new Error("STATEMENT_UNAVAILABLE");
  return ((data ?? []) as unknown as StatementRow[]).map(toStatementDto);
}

export async function getStatementDetail(
  client: Client,
  userId: string,
  reference: string,
): Promise<StatementDetailDto | null> {
  const { data, error } = await client
    .from("account_statements")
    .select(LIST_SELECT)
    .eq("user_id", userId)
    .eq("public_reference", reference)
    .maybeSingle();
  if (error) throw new Error("STATEMENT_UNAVAILABLE");
  if (!data) return null;
  return toStatementDetailDto(data as unknown as StatementRow);
}

/** Extracts the customer-safe code from a PostgreSQL exception message (§49). */
function failureCodeFrom(message: string): string {
  const known = [
    "ACCOUNT_UNAVAILABLE",
    "INVALID_PERIOD",
    "PERIOD_IN_FUTURE",
    "PERIOD_TOO_LONG",
    "PERIOD_BEFORE_ACCOUNT_OPENING",
    "STATEMENT_RECONCILIATION_FAILED",
    "STATEMENT_UNAVAILABLE",
  ];
  return known.find((code) => message.includes(code)) ?? "GENERATION_FAILED";
}

/**
 * Issues (or reuses) an official statement and guarantees a stored PDF.
 * Idempotent: an identical period already READY is returned untouched (§46).
 */
export async function generateStatement(
  client: Client,
  userId: string,
  request: StatementGenerationRequest,
): Promise<StatementDetailDto> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const issued = await supabaseAdmin.rpc("issue_account_statement", {
    _user_id: userId,
    _account_reference: request.accountReference,
    _period_start: request.periodStart,
    _period_end: request.periodEnd,
    _period_kind: request.periodKind,
  } as never);
  if (issued.error) throw new Error(failureCodeFrom(issued.error.message));

  const row = (Array.isArray(issued.data) ? issued.data[0] : issued.data) as
    | { reference: string; reused: boolean }
    | undefined;
  if (!row?.reference) throw new Error("GENERATION_FAILED");

  if (!row.reused) {
    try {
      const statement = await getStatementDetail(client, userId, row.reference);
      if (!statement) throw new Error("STATEMENT_UNAVAILABLE");

      const { data: snapshotRow, error: snapshotError } = await supabaseAdmin
        .from("account_statements")
        .select("snapshot")
        .eq("public_reference", row.reference)
        .maybeSingle();
      if (snapshotError || !snapshotRow) throw new Error("GENERATION_FAILED");

      const { renderStatementPdf } = await import(
        "@/features/statements/templates/statement-pdf.server"
      );
      const pdf = await renderStatementPdf(
        row.reference,
        snapshotRow.snapshot as unknown as StatementSnapshot,
      );

      const storagePath = `${userId}/statements/${row.reference}.pdf`;
      const upload = await supabaseAdmin.storage
        .from(DOCUMENT_BUCKET)
        .upload(storagePath, pdf.bytes, {
          contentType: pdf.mimeType,
          cacheControl: "0",
          upsert: true,
        });
      if (upload.error) throw new Error("GENERATION_FAILED");

      const finalized = await supabaseAdmin.rpc("finalize_account_statement", {
        _user_id: userId,
        _statement_reference: row.reference,
        _storage_path: storagePath,
        _file_name: pdf.fileName,
        _mime_type: pdf.mimeType,
        _size_bytes: pdf.sizeBytes,
        _checksum: pdf.checksum,
      } as never);
      if (finalized.error) throw new Error("GENERATION_FAILED");
    } catch (error) {
      const code =
        error instanceof Error ? failureCodeFrom(error.message) : "GENERATION_FAILED";
      await supabaseAdmin.rpc("fail_account_statement", {
        _user_id: userId,
        _statement_reference: row.reference,
        _failure_code: code,
      } as never);
      throw new Error(code);
    }
  }

  const detail = await getStatementDetail(client, userId, row.reference);
  if (!detail) throw new Error("STATEMENT_UNAVAILABLE");
  return detail;
}
