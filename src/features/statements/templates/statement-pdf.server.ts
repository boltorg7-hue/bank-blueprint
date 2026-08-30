/**
 * Official account statement renderer (PROMPT 09 §28 – §42).
 *
 * Everything drawn here comes from the immutable snapshot produced by
 * `issue_account_statement`. This module performs NO financial computation:
 * opening balance, running balances, totals and closing balance are read as-is
 * (§9, §10, §25). Long periods paginate; the header repeats on every page.
 */
import {
  A4,
  MARGIN,
  clamp,
  contentWidth,
  createPdfContext,
  drawDocumentHeader,
  finalisePages,
  newPage,
  rule,
  sha256Hex,
  text,
  zebra,
} from "@/features/documents/templates/pdf-kit.server";

export type StatementSnapshotLine = {
  reference: string;
  occurredAt: string;
  description: string;
  direction: "CREDIT" | "DEBIT";
  amountMinor: number;
  balanceMinor: number;
};

export type StatementSnapshot = {
  holderName: string;
  accountReference: string;
  accountMaskedNumber: string;
  accountDisplayName: string;
  accountType: string;
  iban: string | null;
  bic: string | null;
  currency: string;
  minorUnit: number;
  periodStart: string;
  periodEnd: string;
  openingBalanceMinor: number;
  closingBalanceMinor: number;
  totalCreditMinor: number;
  totalDebitMinor: number;
  transactionCount: number;
  lines: StatementSnapshotLine[];
};

const LOCALE = "fr-FR";

function money(minor: number, currency: string, minorUnit: number): string {
  const scale = 10 ** minorUnit;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: minorUnit,
    maximumFractionDigits: minorUnit,
  }).format(minor / scale);
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function longDate(value: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

/** period_end is exclusive in the ledger query; the document shows the last day. */
function inclusiveEnd(periodEnd: string): string {
  return new Date(new Date(periodEnd).getTime() - 86_400_000).toISOString();
}

const COLUMNS = {
  date: MARGIN.left,
  description: MARGIN.left + 62,
  amount: MARGIN.left + contentWidth - 190,
  balance: A4.width - MARGIN.right,
} as const;

const ROW_HEIGHT = 17;

export type RenderedPdf = {
  bytes: Uint8Array;
  checksum: string;
  fileName: string;
  sizeBytes: number;
  mimeType: "application/pdf";
};

export async function renderStatementPdf(
  reference: string,
  snapshot: StatementSnapshot,
): Promise<RenderedPdf> {
  const ctx = await createPdfContext();
  const issuedAt = new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date());

  ctx.doc.setTitle(`Relevé de compte ${reference}`);
  ctx.doc.setSubject(`Relevé officiel du compte ${snapshot.accountReference}`);

  drawDocumentHeader(ctx, { title: "Relevé de compte", reference, issuedAt });

  // ---------- Holder & account identification (§23, §87) ----------
  text(ctx, snapshot.holderName, { size: 11, bold: true });
  ctx.y -= 14;
  text(ctx, `${snapshot.accountDisplayName} - ${snapshot.accountReference}`, {
    size: 9,
    color: "muted",
  });
  ctx.y -= 12;
  text(ctx, `Compte se terminant par ${snapshot.accountMaskedNumber}`, {
    size: 9,
    color: "muted",
  });
  if (snapshot.iban) {
    ctx.y -= 12;
    text(ctx, `IBAN ${snapshot.iban}${snapshot.bic ? ` - BIC ${snapshot.bic}` : ""}`, {
      size: 9,
      color: "muted",
    });
  }

  const periodLabel = `${longDate(snapshot.periodStart)} au ${longDate(inclusiveEnd(snapshot.periodEnd))}`;
  text(ctx, "Période du relevé", {
    align: "right",
    y: ctx.y + 26,
    size: 8,
    color: "muted",
  });
  text(ctx, periodLabel, { align: "right", y: ctx.y + 12, size: 9, bold: true });
  text(ctx, `Devise ${snapshot.currency}`, {
    align: "right",
    y: ctx.y,
    size: 8,
    color: "muted",
  });

  // ---------- Reconciled summary (§11, §12, §26) ----------
  ctx.y -= 30;
  const boxTop = ctx.y;
  ctx.page.drawRectangle({
    x: MARGIN.left,
    y: boxTop - 52,
    width: contentWidth,
    height: 62,
    borderWidth: 0.6,
    borderColor: { type: "RGB", red: 0.83, green: 0.86, blue: 0.9 } as never,
  });

  const cells: { label: string; value: string; bold?: boolean }[] = [
    {
      label: "Solde d'ouverture",
      value: money(snapshot.openingBalanceMinor, snapshot.currency, snapshot.minorUnit),
    },
    {
      label: "Total des crédits",
      value: money(snapshot.totalCreditMinor, snapshot.currency, snapshot.minorUnit),
    },
    {
      label: "Total des débits",
      value: money(snapshot.totalDebitMinor, snapshot.currency, snapshot.minorUnit),
    },
    {
      label: "Solde de clôture",
      value: money(snapshot.closingBalanceMinor, snapshot.currency, snapshot.minorUnit),
      bold: true,
    },
  ];
  const cellWidth = contentWidth / cells.length;
  cells.forEach((cell, index) => {
    const x = MARGIN.left + index * cellWidth + 10;
    text(ctx, cell.label, { x, y: boxTop - 12, size: 7.5, color: "muted" });
    text(ctx, cell.value, {
      x,
      y: boxTop - 30,
      size: 10,
      ...(cell.bold ? { bold: true } : {}),
    });
  });
  text(ctx, `${snapshot.transactionCount} opération(s) sur la période`, {
    x: MARGIN.left + 10,
    y: boxTop - 46,
    size: 7.5,
    color: "muted",
  });

  ctx.y = boxTop - 76;

  // ---------- Operations table (§30, §31) ----------
  const drawTableHead = () => {
    text(ctx, "Date", { size: 8, bold: true, color: "muted" });
    text(ctx, "Libellé", { x: COLUMNS.description, size: 8, bold: true, color: "muted" });
    text(ctx, "Montant", {
      align: "right",
      maxX: COLUMNS.amount + 90,
      size: 8,
      bold: true,
      color: "muted",
    });
    text(ctx, "Solde", { align: "right", size: 8, bold: true, color: "muted" });
    rule(ctx, ctx.y - 6);
    ctx.y -= 20;
  };

  drawTableHead();

  if (snapshot.lines.length === 0) {
    text(ctx, "Aucune opération enregistrée sur cette période.", {
      size: 9,
      color: "muted",
    });
    ctx.y -= 20;
  }

  snapshot.lines.forEach((line, index) => {
    if (ctx.y < MARGIN.bottom + 60) {
      newPage(ctx);
      drawDocumentHeader(ctx, { title: "Relevé de compte", reference, issuedAt });
      text(ctx, `${snapshot.holderName} - ${snapshot.accountReference}`, {
        size: 9,
        color: "muted",
      });
      ctx.y -= 12;
      text(ctx, `Période : ${periodLabel} (suite)`, { size: 8, color: "muted" });
      ctx.y -= 22;
      drawTableHead();
    }

    if (index % 2 === 1) zebra(ctx, ctx.y - 5, ROW_HEIGHT);

    const signedAmount = `${line.direction === "CREDIT" ? "+" : "-"}${money(
      line.amountMinor,
      snapshot.currency,
      snapshot.minorUnit,
    )}`;

    text(ctx, shortDate(line.occurredAt), { size: 8.5 });
    text(
      ctx,
      clamp(ctx.regular, line.description, 8.5, COLUMNS.amount - COLUMNS.description - 14),
      { x: COLUMNS.description, size: 8.5 },
    );
    text(ctx, signedAmount, { align: "right", maxX: COLUMNS.amount + 90, size: 8.5 });
    text(ctx, money(line.balanceMinor, snapshot.currency, snapshot.minorUnit), {
      align: "right",
      size: 8.5,
    });

    ctx.y -= 10;
    text(ctx, line.reference, { size: 6.5, color: "muted" });
    ctx.y -= ROW_HEIGHT - 4;
  });

  rule(ctx, ctx.y + 6);
  ctx.y -= 12;
  text(ctx, "Solde de clôture au " + longDate(inclusiveEnd(snapshot.periodEnd)), {
    size: 9,
    bold: true,
  });
  text(ctx, money(snapshot.closingBalanceMinor, snapshot.currency, snapshot.minorUnit), {
    align: "right",
    size: 10,
    bold: true,
  });

  finalisePages(ctx, reference);

  const bytes = await ctx.doc.save();
  const checksum = await sha256Hex(bytes);
  return {
    bytes,
    checksum,
    fileName: `releve-${snapshot.accountReference}-${snapshot.periodStart.slice(0, 10)}.pdf`,
    sizeBytes: bytes.byteLength,
    mimeType: "application/pdf",
  };
}
