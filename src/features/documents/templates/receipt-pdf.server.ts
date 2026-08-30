/**
 * Receipt renderer for completed operations (PROMPT 09 §74 – §84).
 *
 * A receipt is only ever produced from a snapshot prepared by
 * `prepare_customer_receipt`, which refuses anything that is not authoritatively
 * completed (§78 – §81). No provisional wording, no estimated amount.
 */
import {
  MARGIN,
  contentWidth,
  createPdfContext,
  drawDocumentHeader,
  finalisePages,
  rule,
  sha256Hex,
  text,
} from "@/features/documents/templates/pdf-kit.server";
import type { RenderedPdf } from "@/features/statements/templates/statement-pdf.server";

const LOCALE = "fr-FR";

function money(minor: number, currency: string, minorUnit: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: minorUnit,
    maximumFractionDigits: minorUnit,
  }).format(minor / 10 ** minorUnit);
}

function dateTime(value: string | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export type TransferReceiptSnapshot = {
  kind: string;
  transferReference: string;
  status: string;
  amountMinor: number;
  currency: string;
  minorUnit: number;
  customerReference: string | null;
  recipientDisplay: string;
  destinationMasked: string;
  sourceMasked: string;
  sourceAccountReference: string | null;
  destinationBankName: string | null;
  destinationCountry: string | null;
  completedAt: string | null;
  transactionReference: string | null;
};

export type TransactionReceiptSnapshot = {
  transactionReference: string;
  transactionType: string;
  status: string;
  occurredAt: string;
  completedAt: string | null;
  description: string;
  direction: "INCOMING" | "OUTGOING";
  amountMinor: number;
  currency: string;
  minorUnit: number;
  accountReference: string;
  accountMaskedNumber: string;
  counterpartyDisplay: string | null;
};

type Row = { label: string; value: string };

async function renderReceipt(
  reference: string,
  title: string,
  headline: { amount: string; caption: string },
  rows: Row[],
  fileName: string,
): Promise<RenderedPdf> {
  const ctx = await createPdfContext();
  const issuedAt = dateTime(new Date().toISOString());
  ctx.doc.setTitle(title);

  drawDocumentHeader(ctx, { title, reference, issuedAt });

  ctx.page.drawRectangle({
    x: MARGIN.left,
    y: ctx.y - 40,
    width: contentWidth,
    height: 62,
    borderWidth: 0.6,
    borderColor: { type: "RGB", red: 0.83, green: 0.86, blue: 0.9 } as never,
  });
  text(ctx, headline.caption, { x: MARGIN.left + 12, y: ctx.y + 6, size: 8, color: "muted" });
  text(ctx, headline.amount, { x: MARGIN.left + 12, y: ctx.y - 18, size: 18, bold: true });
  text(ctx, "Opération exécutée", {
    align: "right",
    maxX: MARGIN.left + contentWidth - 12,
    y: ctx.y - 18,
    size: 9,
    bold: true,
    color: "brand",
  });

  ctx.y -= 66;

  rows.forEach((row) => {
    text(ctx, row.label, { size: 8.5, color: "muted" });
    text(ctx, row.value, { align: "right", size: 9.5 });
    rule(ctx, ctx.y - 7);
    ctx.y -= 24;
  });

  ctx.y -= 6;
  text(
    ctx,
    "Ce reçu atteste l'exécution définitive de l'opération telle qu'enregistrée dans nos livres.",
    { size: 8, color: "muted" },
  );

  finalisePages(ctx, reference);

  const bytes = await ctx.doc.save();
  return {
    bytes,
    checksum: await sha256Hex(bytes),
    fileName,
    sizeBytes: bytes.byteLength,
    mimeType: "application/pdf",
  };
}

export function renderTransferReceiptPdf(
  reference: string,
  snapshot: TransferReceiptSnapshot,
): Promise<RenderedPdf> {
  const isExternal = snapshot.kind === "EXTERNAL_TRANSFER";
  const rows: Row[] = [
    { label: "Référence du virement", value: snapshot.transferReference },
    {
      label: "Type de virement",
      value: isExternal ? "Virement vers une banque externe" : "Virement interne RFC",
    },
    { label: "Date d'exécution", value: dateTime(snapshot.completedAt) },
    { label: "Bénéficiaire", value: snapshot.recipientDisplay },
    { label: "Compte destinataire", value: snapshot.destinationMasked },
    ...(snapshot.destinationBankName
      ? [{ label: "Banque destinataire", value: snapshot.destinationBankName }]
      : []),
    ...(snapshot.destinationCountry
      ? [{ label: "Pays de destination", value: snapshot.destinationCountry }]
      : []),
    {
      label: "Compte débité",
      value: `${snapshot.sourceMasked}${
        snapshot.sourceAccountReference ? ` (${snapshot.sourceAccountReference})` : ""
      }`,
    },
    ...(snapshot.customerReference
      ? [{ label: "Motif indiqué", value: snapshot.customerReference }]
      : []),
    ...(snapshot.transactionReference
      ? [{ label: "Référence comptable", value: snapshot.transactionReference }]
      : []),
  ];

  return renderReceipt(
    reference,
    "Reçu de virement",
    {
      amount: money(snapshot.amountMinor, snapshot.currency, snapshot.minorUnit),
      caption: "Montant transféré",
    },
    rows,
    `recu-virement-${snapshot.transferReference}.pdf`,
  );
}

export function renderTransactionReceiptPdf(
  reference: string,
  snapshot: TransactionReceiptSnapshot,
): Promise<RenderedPdf> {
  const incoming = snapshot.direction === "INCOMING";
  const rows: Row[] = [
    { label: "Référence de l'opération", value: snapshot.transactionReference },
    { label: "Libellé", value: snapshot.description },
    { label: "Sens de l'opération", value: incoming ? "Crédit reçu" : "Débit émis" },
    { label: "Date de valeur", value: dateTime(snapshot.occurredAt) },
    { label: "Date de comptabilisation", value: dateTime(snapshot.completedAt) },
    {
      label: "Compte concerné",
      value: `${snapshot.accountReference} (se terminant par ${snapshot.accountMaskedNumber})`,
    },
    ...(snapshot.counterpartyDisplay
      ? [{ label: "Contrepartie", value: snapshot.counterpartyDisplay }]
      : []),
  ];

  return renderReceipt(
    reference,
    "Reçu d'opération",
    {
      amount: `${incoming ? "+" : "-"}${money(
        snapshot.amountMinor,
        snapshot.currency,
        snapshot.minorUnit,
      )}`,
      caption: incoming ? "Montant crédité" : "Montant débité",
    },
    rows,
    `recu-operation-${snapshot.transactionReference}.pdf`,
  );
}
