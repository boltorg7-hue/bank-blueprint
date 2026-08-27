/**
 * HOMEPAGE CONTENT (PROMPT 02 §8 → §30).
 *
 * The homepage tells a guided story: voir → déplacer → suivre → vérifier →
 * documenter → protéger → dialoguer. Copy stays short and factual.
 */
import {
  Activity,
  BellRing,
  Eye,
  FileText,
  FolderCheck,
  KeyRound,
  LifeBuoy,
  MessagesSquare,
  MonitorSmartphone,
  Receipt,
  Send,
  ShieldCheck,
  Smartphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const HERO = {
  eyebrow: "Banque digitale",
  headline: "Une banque claire, du solde au virement",
  subline:
    "Consultez votre compte en temps réel, effectuez vos virements et suivez chaque étape sans appeler personne.",
  primaryCta: "Ouvrir un compte",
  secondaryCta: "Découvrir la banque",
} as const;

/** §14 — neutral product capabilities only, no regulatory or social proof. */
export const TRUST_STRIP: { label: string; icon: LucideIcon }[] = [
  { label: "Accès sécurisé", icon: KeyRound },
  { label: "Données protégées", icon: ShieldCheck },
  { label: "Solde en temps réel", icon: Eye },
  { label: "Assistance humaine", icon: LifeBuoy },
];

export const CORE_BENEFITS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Votre argent, clairement visible",
    description:
      "Solde disponible, opérations récentes et mouvements en attente réunis sur un même écran.",
    icon: Wallet,
  },
  {
    title: "Des virements simples",
    description:
      "Choisissez un bénéficiaire, saisissez un montant, confirmez. Chaque étape est expliquée.",
    icon: Send,
  },
  {
    title: "Vous gardez le contrôle",
    description:
      "Historique complet, filtres par période et statut, et notifications sur les opérations sensibles.",
    icon: Activity,
  },
  {
    title: "Sécurisée par conception",
    description:
      "Authentification renforcée, sessions maîtrisées et confirmation des actions sensibles.",
    icon: ShieldCheck,
  },
];

/** §83 — storytelling framework rendered as an alternating section list. */
export const PRODUCT_STORY: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  icon: LucideIcon;
}[] = [
  {
    id: "overview",
    eyebrow: "Voir",
    title: "Comprendre votre compte d'un seul regard",
    description:
      "Le tableau de bord réunit le solde disponible, les entrées et sorties du mois et les dernières opérations.",
    points: [
      "Solde disponible et solde comptable distincts",
      "Entrées et sorties du mois",
      "Opérations récentes avec leur statut",
    ],
    icon: Eye,
  },
  {
    id: "transfers",
    eyebrow: "Déplacer",
    title: "Savoir où en est votre virement",
    description:
      "Chaque virement affiche son avancement : demande enregistrée, contrôles, exécution, fonds crédités.",
    points: [
      "Bénéficiaires enregistrés et vérifiés",
      "Récapitulatif avant confirmation",
      "Suivi d'exécution étape par étape",
    ],
    icon: Send,
  },
  {
    id: "verification",
    eyebrow: "Vérifier",
    title: "Des contrôles expliqués, jamais subis",
    description:
      "Lorsqu'une opération nécessite une vérification complémentaire, l'application indique ce qui est attendu et la suite du traitement.",
    points: [
      "Motif de la vérification affiché",
      "Documents demandés listés clairement",
      "Statut de revue visible en continu",
    ],
    icon: FolderCheck,
  },
  {
    id: "documents",
    eyebrow: "Documenter",
    title: "Relevés et documents au même endroit",
    description:
      "Consultez et téléchargez vos relevés, transmettez les documents demandés et suivez leur revue.",
    points: [
      "Relevés consultables et téléchargeables en PDF",
      "Dépôt sécurisé des documents demandés",
      "Statuts : reçu, en revue, accepté, action requise",
    ],
    icon: FileText,
  },
];

export const FINANCIAL_CONTROL = {
  title: "Comprendre l'activité de votre compte en un coup d'œil",
  description:
    "Entrées, sorties et historique des opérations sont présentés avec des filtres simples par période et par statut.",
  points: [
    "Entrées et sorties du mois",
    "Historique complet des opérations",
    "Filtres par date, montant et statut",
  ],
} as const;

export const SECURITY_HIGHLIGHTS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Authentification renforcée",
    description: "Une seconde vérification protège la connexion et les actions sensibles.",
    icon: KeyRound,
  },
  {
    title: "Sessions maîtrisées",
    description: "Consultez vos sessions actives et fermez celles que vous ne reconnaissez pas.",
    icon: MonitorSmartphone,
  },
  {
    title: "Confirmation des opérations",
    description: "Les virements et changements sensibles demandent une confirmation explicite.",
    icon: ShieldCheck,
  },
  {
    title: "Alertes d'activité",
    description: "Vous êtes informé des connexions et des opérations importantes sur votre compte.",
    icon: BellRing,
  },
];

export const SUPPORT_SECTION = {
  title: "Échanger avec votre banque, depuis votre compte",
  description:
    "La messagerie sécurisée relie chaque échange à son contexte : une opération, un document ou une question générale.",
  points: [
    "Conversation rattachée à une opération",
    "Demande de document tracée",
    "Historique des échanges conservé",
  ],
  icon: MessagesSquare,
} as const;

export const INNOVATION_ITEMS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Visibilité en temps réel",
    description: "Les soldes et opérations reflètent l'état réel du compte, sans décalage inutile.",
    icon: Activity,
  },
  {
    title: "Virements transparents",
    description: "L'avancement d'un virement est visible du dépôt à l'exécution.",
    icon: Send,
  },
  {
    title: "Parcours d'identité digital",
    description: "L'ouverture de compte et la vérification d'identité se font en ligne.",
    icon: KeyRound,
  },
  {
    title: "Demandes de documents guidées",
    description: "L'application précise le document attendu et l'état de sa revue.",
    icon: FolderCheck,
  },
  {
    title: "Relevés numériques",
    description: "Générez, consultez et téléchargez vos relevés quand vous en avez besoin.",
    icon: Receipt,
  },
  {
    title: "Accès multi-appareils",
    description: "La même expérience sur smartphone, tablette et ordinateur.",
    icon: Smartphone,
  },
];

/** §27 — no promised approval delays. */
export const ONBOARDING_STEPS: { title: string; description: string }[] = [
  { title: "Créez votre profil", description: "Nom, adresse e-mail et mot de passe." },
  { title: "Confirmez vos coordonnées", description: "Vérification de l'e-mail et du téléphone." },
  {
    title: "Renseignez les informations requises",
    description: "Informations nécessaires à l'ouverture du compte.",
  },
  {
    title: "Vérifiez votre identité",
    description: "Transmission d'une pièce d'identité en ligne.",
  },
  {
    title: "Accédez à votre espace bancaire",
    description: "Votre compte est activé après validation du dossier.",
  },
];

export const HOME_FAQ: { question: string; answer: string }[] = [
  {
    question: "Comment ouvrir un compte ?",
    answer:
      "L'ouverture se fait en ligne : vous créez votre profil, confirmez vos coordonnées, renseignez les informations requises puis vérifiez votre identité. Le compte est activé après validation du dossier.",
  },
  {
    question: "Comment accéder à mon compte ?",
    answer:
      "Depuis la page de connexion, avec votre adresse e-mail et votre mot de passe, complétés par une seconde vérification lorsqu'elle est requise.",
  },
  {
    question: "Comment effectuer un virement ?",
    answer:
      "Depuis votre espace client : sélectionnez un bénéficiaire, saisissez le montant, vérifiez le récapitulatif puis confirmez l'opération.",
  },
  {
    question: "Où trouver mes relevés ?",
    answer:
      "Dans la rubrique Relevés de votre espace client. Vous pouvez les consulter en ligne et les télécharger au format PDF.",
  },
  {
    question: "Que se passe-t-il lorsqu'une vérification est nécessaire ?",
    answer:
      "L'application indique le motif, les documents attendus et l'état de la revue. Vous suivez l'avancement depuis votre espace client.",
  },
  {
    question: "Comment contacter la banque ?",
    answer:
      "Les clients utilisent la messagerie sécurisée de leur espace. Les visiteurs peuvent passer par le formulaire de contact public.",
  },
];
