/**
 * LEGAL CONTENT STRUCTURE (PROMPT 02 §47-§50).
 *
 * These documents provide the correct STRUCTURE only. The published text must
 * be supplied by the legal owner — sections marked `pending` render an explicit
 * "en cours de rédaction" notice instead of invented legal statements.
 */

import type { AppPath } from "@/lib/routing";

export type LegalSection = {
  id: string;
  title: string;
  /** Final legal text. Empty array => section pending publication. */
  paragraphs: string[];
};

export type LegalDocument = {
  slug: "terms" | "privacy";
  title: string;
  intro: string;
  /** ISO date of the last published revision, null while unpublished. */
  lastUpdated: string | null;
  sections: LegalSection[];
};

export const PENDING_SECTION_NOTICE =
  "Cette section est en cours de rédaction avec notre conseil juridique. Elle sera publiée avant l'ouverture commerciale.";

export const TERMS_DOCUMENT: LegalDocument = {
  slug: "terms",
  title: "Conditions générales",
  intro:
    "Ces conditions décriront la relation contractuelle entre le client et la banque : ouverture de compte, utilisation des services, obligations réciproques et fin de la relation.",
  lastUpdated: null,
  sections: [
    { id: "scope", title: "1. Objet et champ d'application", paragraphs: [] },
    { id: "account-opening", title: "2. Ouverture de compte et vérification d'identité", paragraphs: [] },
    { id: "services", title: "3. Services fournis", paragraphs: [] },
    { id: "access", title: "4. Accès en ligne et sécurité des identifiants", paragraphs: [] },
    { id: "operations", title: "5. Opérations et virements", paragraphs: [] },
    { id: "controls", title: "6. Contrôles et vérifications complémentaires", paragraphs: [] },
    { id: "fees", title: "7. Tarifs et frais", paragraphs: [] },
    { id: "statements", title: "8. Relevés et documents", paragraphs: [] },
    { id: "liability", title: "9. Responsabilités", paragraphs: [] },
    { id: "termination", title: "10. Durée, modification et clôture", paragraphs: [] },
    { id: "claims", title: "11. Réclamations et médiation", paragraphs: [] },
    { id: "law", title: "12. Droit applicable", paragraphs: [] },
  ],
};

export const PRIVACY_DOCUMENT: LegalDocument = {
  slug: "privacy",
  title: "Politique de confidentialité",
  intro:
    "Cette politique décrira les données que nous collectons, les raisons de cette collecte, leur durée de conservation et les droits dont vous disposez.",
  lastUpdated: null,
  sections: [
    { id: "collected", title: "1. Données collectées", paragraphs: [] },
    { id: "purposes", title: "2. Finalités du traitement", paragraphs: [] },
    { id: "usage", title: "3. Utilisation des données", paragraphs: [] },
    { id: "sharing", title: "4. Destinataires et sous-traitants", paragraphs: [] },
    { id: "retention", title: "5. Durée de conservation", paragraphs: [] },
    { id: "security", title: "6. Sécurité des données", paragraphs: [] },
    { id: "rights", title: "7. Vos droits", paragraphs: [] },
    { id: "cookies", title: "8. Technologies de suivi", paragraphs: [] },
    { id: "contact", title: "9. Contact", paragraphs: [] },
  ],
};

/**
 * Cookie posture (§50): the site currently uses only strictly necessary
 * technologies (theme and privacy-mode preferences). No consent banner is
 * displayed, because there is nothing optional to consent to. If analytics or
 * marketing technologies are introduced later, a real consent mechanism must
 * gate them — never a decorative banner.
 */
export const COOKIE_POSTURE = {
  usesOptionalTracking: false,
  strictlyNecessary: [
    {
      name: "Préférence de thème",
      purpose: "Conserver l'affichage clair ou sombre choisi.",
      storage: "Stockage local du navigateur",
    },
    {
      name: "Mode confidentialité",
      purpose: "Se souvenir du masquage des montants à l'écran.",
      storage: "Stockage local du navigateur",
    },
    {
      name: "Session d'authentification",
      purpose: "Maintenir votre connexion à l'espace client.",
      storage: "Cookie / stockage sécurisé",
    },
  ],
} as const;

export const LEGAL_HUB_LINKS: { label: string; to: AppPath; description: string }[] = [
  {
    label: "Conditions générales",
    to: "/terms",
    description: "Cadre contractuel de la relation bancaire.",
  },
  {
    label: "Politique de confidentialité",
    to: "/privacy",
    description: "Traitement et protection de vos données personnelles.",
  },
  {
    label: "Tarifs",
    to: "/pricing",
    description: "Conditions tarifaires applicables aux comptes et opérations.",
  },
  {
    label: "Sécurité",
    to: "/security",
    description: "Protection de votre compte et bonnes pratiques.",
  },
];

export const ACCESSIBILITY_STATEMENT = {
  title: "Déclaration d'accessibilité",
  description:
    "Nous visons le niveau WCAG 2.2 AA : navigation au clavier, contrastes suffisants, focus visible, respect des préférences de mouvement réduit et compatibilité lecteur d'écran. Signalez-nous toute difficulté rencontrée via la page Contact.",
} as const;
