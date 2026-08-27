/**
 * PUBLIC SITE CONTENT — navigation, footer and shared copy (PROMPT 02 §55).
 *
 * All marketing copy lives in this content layer so pages stay presentational
 * and text can be edited without touching components.
 *
 * RULES (PROMPT 02 §14, §78, §80):
 * - no invented licences, ratings, customer counts, awards or testimonials;
 * - no invented pricing amounts (see pricing.ts);
 * - regulatory identity values stay null until officially supplied.
 */

export const PUBLIC_CTA = {
  /** Primary conversion wording — must stay identical site-wide (§54). */
  primary: "Ouvrir un compte",
  primaryTo: "/register",
  secondary: "Se connecter",
  secondaryTo: "/login",
} as const;

export type PublicNavLink = { label: string; to: string; description?: string };

export const PUBLIC_PRIMARY_NAV: PublicNavLink[] = [
  { label: "Comptes", to: "/accounts", description: "Le compte courant Vaultis" },
  { label: "Fonctionnalités", to: "/features", description: "Ce que vous pouvez faire" },
  { label: "Sécurité", to: "/security", description: "Protection de votre compte" },
  { label: "Tarifs", to: "/pricing", description: "Conditions tarifaires" },
  { label: "À propos", to: "/about", description: "La banque et sa mission" },
  { label: "Aide", to: "/help", description: "Centre d'aide et contact" },
];

export const PUBLIC_FOOTER_GROUPS: { title: string; links: PublicNavLink[] }[] = [
  {
    title: "Banque",
    links: [
      { label: "Comptes", to: "/accounts" },
      { label: "Fonctionnalités", to: "/features" },
      { label: "Tarifs", to: "/pricing" },
      { label: "Sécurité", to: "/security" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "À propos", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Assistance",
    links: [
      { label: "Centre d'aide", to: "/help" },
      { label: "Questions fréquentes", to: "/help" },
    ],
  },
  {
    title: "Informations légales",
    links: [
      { label: "Informations légales", to: "/legal" },
      { label: "Conditions générales", to: "/terms" },
      { label: "Confidentialité", to: "/privacy" },
    ],
  },
];

/**
 * Legal entity information (§80). Values remain null until the operating
 * company supplies verified data — never fabricate them.
 */
export const LEGAL_IDENTITY = {
  legalEntity: null as string | null,
  registrationNumber: null as string | null,
  registeredOffice: null as string | null,
  regulator: null as string | null,
  licenceReference: null as string | null,
  depositProtection: null as string | null,
} as const;

export const SECURITY_WARNING =
  "Ne communiquez jamais votre mot de passe, votre code PIN ni un code de vérification à usage unique.";
