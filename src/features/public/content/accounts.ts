/**
 * ACCOUNTS PAGE CONTENT (PROMPT 02 §28-§29, §35).
 *
 * Only one real product is defined today: the personal current account.
 * Additional products must be added here once the business defines them —
 * never invent commercial offers, rates or eligibility rules.
 */

export type AccountProduct = {
  id: string;
  name: string;
  summary: string;
  benefits: string[];
  /** Pricing summary text — no invented amounts (§32). */
  pricingSummary: string;
  eligibility: string;
  ctaLabel: string;
  /** Reserved for future products (business, premium) — hidden while false. */
  available: boolean;
};

export const ACCOUNT_PRODUCTS: AccountProduct[] = [
  {
    id: "personal-current",
    name: "Compte courant particulier",
    summary:
      "Le compte du quotidien : consultation en temps réel, virements et relevés numériques.",
    benefits: [
      "Solde disponible et historique complet",
      "Virements vers vos bénéficiaires enregistrés",
      "Relevés consultables et téléchargeables",
      "Messagerie sécurisée avec la banque",
    ],
    pricingSummary: "Conditions tarifaires détaillées sur la page Tarifs.",
    eligibility: "Personne physique majeure, après vérification d'identité.",
    ctaLabel: "Ouvrir un compte",
    available: true,
  },
];

export const ACCOUNT_SECTIONS: { title: string; description: string; points: string[] }[] = [
  {
    title: "Accès digital",
    description: "Votre compte est accessible depuis un smartphone, une tablette ou un ordinateur.",
    points: [
      "Même expérience sur tous les appareils",
      "Sessions consultables et révocables",
      "Mode confidentialité pour masquer les montants",
    ],
  },
  {
    title: "Opérations courantes",
    description: "Les actions du quotidien sont accessibles en deux ou trois étapes.",
    points: [
      "Consulter le solde et les opérations",
      "Effectuer un virement",
      "Ajouter un bénéficiaire",
      "Télécharger un relevé",
    ],
  },
  {
    title: "Relevés et documents",
    description: "Les documents liés à votre compte restent disponibles dans votre espace.",
    points: [
      "Relevés de compte au format PDF",
      "Dépôt des documents demandés",
      "Suivi de la revue des documents",
    ],
  },
];

export const BUSINESS_RESERVED = {
  title: "Comptes professionnels",
  description:
    "L'offre destinée aux professionnels n'est pas encore ouverte. Elle sera présentée ici lorsqu'elle sera définie.",
} as const;
