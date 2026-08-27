/**
 * PRICING CONTENT (PROMPT 02 §30-§32).
 *
 * NO INVENTED AMOUNTS. Commercial pricing has not been defined, so every
 * amount stays null and the UI renders "À définir". When the business
 * supplies the grid, only this file changes.
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

export const PRICING_DISCLAIMER =
  "Les conditions tarifaires définitives seront publiées ici avant l'ouverture commerciale. Aucune valeur affichée comme « à définir » ne constitue un engagement.";

export const PRICING_CATEGORIES: PricingCategory[] = [
  {
    id: "account",
    title: "Tenue de compte",
    description: "Frais liés à l'ouverture et à la gestion du compte courant.",
    lines: [
      { label: "Ouverture de compte", amount: null },
      { label: "Tenue de compte mensuelle", amount: null },
      { label: "Clôture de compte", amount: null },
    ],
  },
  {
    id: "transfers",
    title: "Virements",
    description: "Opérations de virement depuis votre compte.",
    lines: [
      { label: "Virement interne entre comptes Vaultis", amount: null },
      { label: "Virement externe", amount: null },
      { label: "Virement nécessitant une vérification complémentaire", amount: null, note: "Aucun frais spécifique lié aux contrôles." },
    ],
  },
  {
    id: "statements",
    title: "Relevés et documents",
    description: "Documents générés depuis votre espace client.",
    lines: [
      { label: "Relevé numérique (PDF)", amount: null },
      { label: "Duplicata de relevé", amount: null },
    ],
  },
  {
    id: "support",
    title: "Assistance",
    description: "Canaux d'assistance mis à disposition.",
    lines: [
      { label: "Messagerie sécurisée", amount: null },
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
