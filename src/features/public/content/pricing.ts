import {
  FEE_CURRENCIES,
  FEE_MINOR_UNIT,
  FEE_SCHEDULE,
  type FeeCode,
} from "@/config/fees";
import { formatMoneyFromMinor } from "@/lib/format/currency";

/**
 * PRICING CONTENT (PROMPT 02 §30-§32).
 *
 * NO INVENTED AMOUNTS. Every displayed amount is derived from the central fee
 * schedule (`src/config/fees.ts`). A fee left at `null` there renders as
 * "À définir"; a fee set to 0 renders as "Sans frais". Changing the published
 * grid means editing the fee schedule, never this file.
 */

export type PricingLine = {
  label: string;
  /** Final published amount. Null while undefined — never fabricate. */
  amount: string | null;
  note?: string;
};

export type PricingCategory = {
  id: string;
  title: string;
  description: string;
  lines: PricingLine[];
};

/** Displayed wherever an amount is not yet defined. */
export const PRICE_UNDEFINED_LABEL = "À définir";

/** Displayed when the schedule explicitly states a zero fee. */
export const PRICE_FREE_LABEL = "Sans frais";

export const PRICING_DISCLAIMER =
  "Les conditions tarifaires définitives seront publiées ici avant l'ouverture commerciale. Aucune valeur affichée comme « à définir » ne constitue un engagement. Les montants indiqués s'appliquent dans la devise du compte concerné.";

/** Renders one schedule entry as a published pricing line. */
export function pricingLineFor(code: FeeCode): PricingLine {
  const definition = FEE_SCHEDULE[code];
  const quotes = FEE_CURRENCIES.map((currency) => ({
    currency,
    minor: definition.amounts[currency] ?? null,
  }));

  const contracted = quotes.filter((quote) => quote.minor !== null);
  const line: PricingLine = { label: definition.label, amount: null };
  if (definition.note) line.note = definition.note;

  if (contracted.length === 0) return line;
  if (contracted.every((quote) => quote.minor === 0)) {
    return { ...line, amount: PRICE_FREE_LABEL };
  }

  return {
    ...line,
    amount: contracted
      .map((quote) =>
        formatMoneyFromMinor(quote.minor as number, {
          currency: quote.currency,
          minorUnitScale: 10 ** FEE_MINOR_UNIT,
        }),
      )
      .join(" · "),
  };
}

export const PRICING_CATEGORIES: PricingCategory[] = [
  {
    id: "account",
    title: "Tenue de compte",
    description: "Frais liés à l'ouverture et à la gestion du compte courant.",
    lines: [
      pricingLineFor("ACCOUNT_OPENING"),
      pricingLineFor("ACCOUNT_MAINTENANCE_MONTHLY"),
      pricingLineFor("ACCOUNT_CLOSING"),
    ],
  },
  {
    id: "transfers",
    title: "Virements",
    description:
      "Opérations de virement depuis votre compte. Le montant applicable vous est affiché avant confirmation, dans la devise du compte débité.",
    lines: [
      pricingLineFor("TRANSFER_INTERNAL"),
      pricingLineFor("TRANSFER_EXTERNAL"),
      pricingLineFor("TRANSFER_COMPLIANCE_REVIEW"),
    ],
  },
  {
    id: "statements",
    title: "Relevés et documents",
    description: "Documents générés depuis votre espace client.",
    lines: [pricingLineFor("STATEMENT_DIGITAL"), pricingLineFor("STATEMENT_DUPLICATE")],
  },
  {
    id: "support",
    title: "Assistance",
    description: "Canaux d'assistance mis à disposition.",
    lines: [
      { label: "Messagerie sécurisée", amount: PRICE_FREE_LABEL },
      { label: "Assistance sur demande particulière", amount: null },
    ],
  },
  {
    id: "extras",
    title: "Services additionnels",
    description: "Services optionnels, ajoutés au fur et à mesure de l'ouverture du produit.",
    lines: [{ label: "Services optionnels", amount: null }],
  },
];
