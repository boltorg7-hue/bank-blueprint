/**
 * Application-wide configuration for the banking platform.
 * Keep marketing/product copy here so layouts stay presentational.
 */
export const APP_CONFIG = {
  name: "RFC",
  fullName: "RFC Royal FINANCE Bank",
  legalName: "RFC Royal FINANCE Bank",
  tagline: "La banque digitale, pensée pour votre quotidien",
  description:
    "RFC Royal FINANCE Bank est une plateforme bancaire digitale : comptes, virements et suivi de vos opérations, avec une sécurité de niveau bancaire.",
  supportEmail: "support@rfcroyalfinance.com",
  foundedOn: "1972-07-23",
  swiftBic: "RBTTTTPXXX",
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
