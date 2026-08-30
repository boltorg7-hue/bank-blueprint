/**
 * Shared PDF layout primitives (PROMPT 09 §28 – §40).
 *
 * Server-only: PDFs are rendered with privileged credentials and stored in a
 * private bucket, never assembled in the browser (§4, §5).
 *
 * The layout is deliberately sober and bank-like: A4, generous margins,
 * institutional header with the legal identity, table with monospaced-looking
 * right-aligned amounts, legal footer and "page X / Y" on every page (§33–§40).
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { APP_CONFIG } from "@/config/app";
import { LEGAL_IDENTITY } from "@/features/public/content/site";

export const A4 = { width: 595.28, height: 841.89 } as const;
export const MARGIN = { left: 48, right: 48, top: 52, bottom: 64 } as const;

const INK = rgb(0.09, 0.13, 0.2);
const MUTED = rgb(0.42, 0.47, 0.54);
const RULE = rgb(0.83, 0.86, 0.9);
const BRAND_INK = rgb(0.05, 0.24, 0.36);
const ZEBRA = rgb(0.965, 0.973, 0.98);

/**
 * pdf-lib standard fonts encode WinAnsi. Intl produces narrow/no-break spaces
 * and typographic dashes that WinAnsi rejects, so every string is normalised
 * before drawing (§40).
 */
export function pdfSafe(value: string): string {
  return value
    .replace(/[\u202f\u00a0\u2009]/g, " ")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u20ac/g, "EUR")
    .replace(/[^\x20-\x7E\u00C0-\u00FF]/g, " ");
}

export type PdfContext = {
  doc: PDFDocument;
  regular: PDFFont;
  bold: PDFFont;
  pages: PDFPage[];
  page: PDFPage;
  y: number;
};

export async function createPdfContext(): Promise<PdfContext> {
  const doc = await PDFDocument.create();
  doc.setProducer(APP_CONFIG.legalName);
  doc.setCreator(APP_CONFIG.legalName);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([A4.width, A4.height]);
  return { doc, regular, bold, pages: [page], page, y: A4.height - MARGIN.top };
}

export function newPage(ctx: PdfContext): void {
  const page = ctx.doc.addPage([A4.width, A4.height]);
  ctx.pages.push(page);
  ctx.page = page;
  ctx.y = A4.height - MARGIN.top;
}

export const contentWidth = A4.width - MARGIN.left - MARGIN.right;

export function text(
  ctx: PdfContext,
  value: string,
  options: {
    x?: number;
    y?: number;
    size?: number;
    bold?: boolean;
    color?: "ink" | "muted" | "brand";
    align?: "left" | "right";
    maxX?: number;
  } = {},
): void {
  const size = options.size ?? 10;
  const font = options.bold ? ctx.bold : ctx.regular;
  const safe = pdfSafe(value);
  const color =
    options.color === "muted" ? MUTED : options.color === "brand" ? BRAND_INK : INK;
  const width = font.widthOfTextAtSize(safe, size);
  const x =
    options.align === "right"
      ? (options.maxX ?? A4.width - MARGIN.right) - width
      : (options.x ?? MARGIN.left);
  ctx.page.drawText(safe, { x, y: options.y ?? ctx.y, size, font, color });
}

export function rule(ctx: PdfContext, y: number): void {
  ctx.page.drawLine({
    start: { x: MARGIN.left, y },
    end: { x: A4.width - MARGIN.right, y },
    thickness: 0.6,
    color: RULE,
  });
}

export function zebra(ctx: PdfContext, y: number, height: number): void {
  ctx.page.drawRectangle({
    x: MARGIN.left,
    y,
    width: contentWidth,
    height,
    color: ZEBRA,
  });
}

/** Truncates a label to a maximum drawn width, adding an ellipsis. */
export function clamp(
  font: PDFFont,
  value: string,
  size: number,
  maxWidth: number,
): string {
  const safe = pdfSafe(value);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;
  let cut = safe;
  while (cut.length > 1 && font.widthOfTextAtSize(`${cut}...`, size) > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}...`;
}

/** Institutional document header (§34). */
export function drawDocumentHeader(
  ctx: PdfContext,
  options: { title: string; reference: string; issuedAt: string },
): void {
  ctx.page.drawRectangle({
    x: MARGIN.left,
    y: A4.height - MARGIN.top - 6,
    width: 3,
    height: 34,
    color: BRAND_INK,
  });

  text(ctx, APP_CONFIG.legalName, {
    x: MARGIN.left + 12,
    y: A4.height - MARGIN.top + 16,
    size: 14,
    bold: true,
    color: "brand",
  });
  text(ctx, `SWIFT/BIC ${LEGAL_IDENTITY.swiftBic} - ${LEGAL_IDENTITY.regulator}`, {
    x: MARGIN.left + 12,
    y: A4.height - MARGIN.top + 2,
    size: 7.5,
    color: "muted",
  });
  text(ctx, LEGAL_IDENTITY.registeredOffice, {
    x: MARGIN.left + 12,
    y: A4.height - MARGIN.top - 8,
    size: 7.5,
    color: "muted",
  });

  text(ctx, options.title.toUpperCase(), {
    align: "right",
    y: A4.height - MARGIN.top + 16,
    size: 12,
    bold: true,
  });
  text(ctx, options.reference, {
    align: "right",
    y: A4.height - MARGIN.top + 2,
    size: 9,
  });
  text(ctx, `Édité le ${options.issuedAt}`, {
    align: "right",
    y: A4.height - MARGIN.top - 8,
    size: 7.5,
    color: "muted",
  });

  rule(ctx, A4.height - MARGIN.top - 22);
  ctx.y = A4.height - MARGIN.top - 46;
}

/** Legal footer + pagination, applied to every page at the end (§36, §39). */
export function finalisePages(ctx: PdfContext, documentReference: string): void {
  const total = ctx.pages.length;
  ctx.pages.forEach((page, index) => {
    page.drawLine({
      start: { x: MARGIN.left, y: MARGIN.bottom + 26 },
      end: { x: A4.width - MARGIN.right, y: MARGIN.bottom + 26 },
      thickness: 0.6,
      color: RULE,
    });

    const legal = pdfSafe(
      `${APP_CONFIG.legalName} - ${LEGAL_IDENTITY.registrationNumber}`,
    );
    page.drawText(clamp(ctx.regular, legal, 7, contentWidth), {
      x: MARGIN.left,
      y: MARGIN.bottom + 14,
      size: 7,
      font: ctx.regular,
      color: MUTED,
    });
    page.drawText(
      pdfSafe(
        "Document généré électroniquement. Aucune signature manuscrite n'est requise.",
      ),
      {
        x: MARGIN.left,
        y: MARGIN.bottom + 4,
        size: 7,
        font: ctx.regular,
        color: MUTED,
      },
    );

    const pagination = pdfSafe(`${documentReference} - Page ${index + 1} / ${total}`);
    const width = ctx.regular.widthOfTextAtSize(pagination, 7);
    page.drawText(pagination, {
      x: A4.width - MARGIN.right - width,
      y: MARGIN.bottom + 4,
      size: 7,
      font: ctx.regular,
      color: MUTED,
    });
  });
}

/** SHA-256 integrity checksum of the produced file (§43). */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const view = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", view.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
