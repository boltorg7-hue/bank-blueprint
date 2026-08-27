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

import type { AppPath } from "@/lib/routing";

export const PUBLIC_CTA = {
  /** Primary conversion wording — must stay identical site-wide (§54). */
  primary: "Ouvrir un compte",
  primaryTo: "/register",
  secondary: "Se connecter",
  secondaryTo: "/login",
} as const;

export type PublicNavLink = { label: string; to: AppPath; description?: string };

export const PUBLIC_PRIMARY_NAV: PublicNavLink[] = [
  { label: "Comptes", to: "/accounts", description: "Le compte courant RFC" },
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
 * Legal entity information (§80). Values supplied by the operating company.
 * Anything not officially confirmed stays null — never fabricate.
 */
export const LEGAL_IDENTITY = {
  legalEntity: "RFC Royal FINANCE Bank",
  registrationNumber:
    "R 98(C) — Companies Registry, Registrar General's Department, Ministry of Legal Affairs, Trinidad and Tobago",
  registeredOffice:
    "St. Clair Place, 7-8 St. Clair Avenue, Port of Spain 107289, Trinidad and Tobago",
  mailingAddress:
    "Ms Jane Doe Street, Woodbrook 170505, Trinidad and Tobago",
  regulator: "Central Bank of Trinidad and Tobago (CBTT)",
  swiftBic: "RBTTTTPXXX",
  establishedOn: "23 juillet 1972",
  licenceReference: null as string | null,
  shareCapital: null as string | null,
  depositProtection: null as string | null,
} as const;


export const SECURITY_WARNING =
  "Ne communiquez jamais votre mot de passe, votre code PIN ni un code de vérification à usage unique.";
