/**
 * ABOUT PAGE CONTENT (PROMPT 02 §38-§41).
 *
 * No invented people, awards, funding, customer counts or social-impact
 * claims. Governance identities stay empty until officially supplied.
 */

export const ABOUT_INTRO = {
  title: "Une banque digitale construite sur la clarté",
  description:
    "RFC conçoit une banque en ligne dont chaque écran répond à une question simple : où en est mon argent, et que se passe-t-il ensuite ?",
} as const;

export const ABOUT_SECTIONS: { id: string; title: string; paragraphs: string[] }[] = [
  {
    id: "story",
    title: "Notre histoire",
    paragraphs: [
      "RFC est né d'un constat simple : la plupart des interfaces bancaires expliquent mal ce qui arrive à l'argent des clients. Les opérations apparaissent, disparaissent, changent de statut sans explication.",
      "Nous construisons une plateforme bancaire digitale où chaque opération est traçable, chaque contrôle est expliqué, et chaque document est retrouvable.",
    ],
  },
  {
    id: "mission",
    title: "Notre mission",
    paragraphs: [
      "Rendre la banque compréhensible : donner une visibilité fidèle sur les comptes, réduire la complexité inutile et rendre les opérations courantes accessibles en quelques étapes.",
      "Cette mission s'accompagne d'une exigence : maintenir des contrôles financiers responsables, y compris lorsqu'ils ralentissent une opération.",
    ],
  },
  {
    id: "vision",
    title: "Notre vision",
    paragraphs: [
      "Une relation bancaire entièrement digitale, où le client sait à tout moment ce que la banque attend de lui et ce qu'elle a fait de sa demande.",
    ],
  },
  {
    id: "banking",
    title: "Notre approche de la banque",
    paragraphs: [
      "Les soldes ne sont jamais modifiés directement : ils découlent d'écritures comptables en partie double, ce qui garantit la cohérence entre ce que le client voit et ce que la banque enregistre.",
      "Les traitements sensibles sont réalisés côté serveur, avec une trace d'audit, et non dans le navigateur.",
    ],
  },
  {
    id: "technology",
    title: "Technologie et innovation",
    paragraphs: [
      "La plateforme est conçue mobile-first, accessible et rapide sur les réseaux mobiles. Elle fonctionne en ligne, sans copie locale de données bancaires.",
      "L'innovation porte sur la lisibilité du produit : suivi des virements, demandes de documents guidées, relevés numériques et messagerie contextualisée.",
    ],
  },
  {
    id: "responsibility",
    title: "Sécurité et responsabilité",
    paragraphs: [
      "La sécurité fait partie du produit, pas d'une couche ajoutée à la fin : authentification renforcée, confirmation des opérations sensibles, journalisation des accès et gestion des sessions.",
    ],
  },
];

export const ABOUT_VALUES: { title: string; description: string }[] = [
  { title: "Confiance", description: "Ce qui est affiché correspond à ce qui est enregistré." },
  { title: "Clarté", description: "Un langage simple, des états explicites, aucune ambiguïté." },
  { title: "Sécurité", description: "Les protections sont visibles et contrôlables par le client." },
  { title: "Responsabilité", description: "Les contrôles financiers sont appliqués et documentés." },
  { title: "Innovation", description: "Des améliorations concrètes du produit, pas des slogans." },
  { title: "Accessibilité", description: "Utilisable au clavier, au lecteur d'écran et sur petit écran." },
  { title: "Assistance humaine", description: "Une conversation reste possible pour chaque demande." },
];

export const ABOUT_COMMITMENT = {
  title: "Notre engagement client",
  points: [
    "Expliquer l'état de chaque opération.",
    "Indiquer précisément les documents attendus.",
    "Ne jamais demander de mot de passe ni de code de vérification.",
    "Conserver l'historique de vos échanges et de vos documents.",
  ],
} as const;

/**
 * Governance placeholders (§41). Populate only with officially supplied data.
 */
export const ABOUT_GOVERNANCE = {
  title: "Gouvernance",
  description:
    "Les informations de gouvernance et l'identité juridique de l'entité exploitante seront publiées ici lorsqu'elles auront été communiquées officiellement.",
  leadership: [] as { name: string; role: string }[],
} as const;
