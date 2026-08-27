/**
 * Application-wide configuration for the banking platform.
 * Keep marketing/product copy here so layouts stay presentational.
 */
export const APP_CONFIG = {
  name: "RFC",
  legalName: "RFC Digital Bank",
  tagline: "La banque digitale, pensée pour votre quotidien",
  description:
    "RFC est une plateforme bancaire digitale : comptes, virements et suivi de vos opérations, avec une sécurité de niveau bancaire.",
  supportEmail: "support@rfcroyalfinance.com",
  /**
   * This project is a product implementation. It is NOT licensed banking
   * infrastructure — see docs/banking/00 §38.
   */
  isDemoEnvironment: true,
} as const;

export const ROUTE_NAMESPACES = {
  public: "/",
  customer: "/app",
  admin: "/admin",
} as const;
