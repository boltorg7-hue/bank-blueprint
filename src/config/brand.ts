/**
 * BRAND FOUNDATION (PROMPT 01)
 *
 * Single source of truth for brand identity. Components must read from here
 * instead of hardcoding the bank name, initials or typography.
 *
 * Color values themselves live as semantic CSS variables in src/styles.css —
 * this file only documents the direction and holds non-CSS brand data.
 */
import { APP_CONFIG } from "./app";

export const BRAND = {
  name: APP_CONFIG.name,
  legalName: APP_CONFIG.legalName,
  /** Symbol-only mark (compact / favicon / document header). */
  symbol: "R",
  /** Short descriptor used next to the wordmark where space allows. */
  descriptor: "Banque digitale",
  tagline: APP_CONFIG.tagline,
  supportEmail: APP_CONFIG.supportEmail,

  /**
   * Logo variants supported by <BrandMark />. Assets can later replace the
   * typographic mark without touching layout components.
   */
  logo: {
    horizontal: null as string | null,
    symbol: null as string | null,
    onLight: null as string | null,
    onDark: null as string | null,
  },

  typography: {
    display: "Sora",
    body: "Manrope",
    /** Tabular figures for balances and amounts. */
    numeric: "IBM Plex Mono",
  },

  /** Visual direction, documented for future contributors. */
  palette: {
    primary: "deep navy (--primary)",
    brand: "teal financier (--brand)",
    accent: "accent discret (--accent)",
    neutrals: "surfaces claires + gris bleutés (--surface*, --muted)",
    note: "Le bleu de marque reste accentuel : les écrans financiers utilisent des surfaces neutres.",
  },

  locale: {
    /** Default display locale for numbers, dates and currency. */
    tag: "fr-FR",
    currency: "USD",
  },
} as const;

export type BrandLogoVariant = keyof typeof BRAND.logo;
