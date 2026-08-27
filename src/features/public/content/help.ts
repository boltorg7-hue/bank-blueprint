/**
 * HELP CENTER CONTENT (PROMPT 02 §42-§44).
 * Search runs client-side over this content — no search backend needed.
 */
import {
  FileText,
  FolderCheck,
  KeyRound,
  LifeBuoy,
  MessagesSquare,
  Send,
  ShieldCheck,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type HelpArticle = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export const HELP_CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "getting-started", label: "Premiers pas", icon: LifeBuoy },
  { id: "opening", label: "Ouverture de compte", icon: Wallet },
  { id: "access", label: "Connexion et accès", icon: KeyRound },
  { id: "transfers", label: "Virements", icon: Send },
  { id: "documents", label: "Documents", icon: FolderCheck },
  { id: "statements", label: "Relevés", icon: FileText },
  { id: "security", label: "Sécurité", icon: ShieldCheck },
  { id: "profile", label: "Profil", icon: UserRound },
  { id: "contact", label: "Contacter la banque", icon: MessagesSquare },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "start-what-is",
    category: "getting-started",
    question: "Qu'est-ce que Vaultis ?",
    answer:
      "Vaultis est une banque digitale : compte courant, virements, suivi des opérations, relevés numériques, documents et messagerie sécurisée, accessibles en ligne.",
  },
  {
    id: "start-devices",
    category: "getting-started",
    question: "Sur quels appareils puis-je utiliser Vaultis ?",
    answer:
      "Sur smartphone, tablette et ordinateur, depuis un navigateur à jour. Une connexion internet est nécessaire : aucune donnée bancaire n'est conservée hors ligne.",
  },
  {
    id: "open-steps",
    category: "opening",
    question: "Comment ouvrir un compte ?",
    answer:
      "Créez votre profil, confirmez vos coordonnées, renseignez les informations requises puis vérifiez votre identité. Le compte est activé après validation du dossier.",
  },
  {
    id: "open-documents",
    category: "opening",
    question: "Quels documents faut-il fournir ?",
    answer:
      "Une pièce d'identité en cours de validité est demandée. Des justificatifs complémentaires peuvent être requis selon votre situation ; la liste exacte s'affiche dans votre espace.",
  },
  {
    id: "open-delay",
    category: "opening",
    question: "Combien de temps prend la validation ?",
    answer:
      "La durée dépend des vérifications nécessaires. L'état de votre dossier est visible en permanence dans votre espace, avec les actions attendues de votre part.",
  },
  {
    id: "access-login",
    category: "access",
    question: "Comment me connecter ?",
    answer:
      "Depuis la page de connexion, avec votre adresse e-mail et votre mot de passe. Une seconde vérification peut être demandée.",
  },
  {
    id: "access-password",
    category: "access",
    question: "J'ai oublié mon mot de passe.",
    answer:
      "Utilisez le lien de réinitialisation depuis la page de connexion. Un message est envoyé à l'adresse e-mail associée à votre compte.",
  },
  {
    id: "access-blocked",
    category: "access",
    question: "Mon accès est bloqué, que faire ?",
    answer:
      "Après plusieurs tentatives échouées, l'accès est temporairement restreint pour protéger votre compte. Réessayez plus tard ou contactez la banque via le formulaire public.",
  },
  {
    id: "transfer-make",
    category: "transfers",
    question: "Comment effectuer un virement ?",
    answer:
      "Sélectionnez un bénéficiaire, saisissez le montant, vérifiez le récapitulatif puis confirmez. L'avancement du virement s'affiche ensuite dans votre espace.",
  },
  {
    id: "transfer-status",
    category: "transfers",
    question: "Comment suivre un virement ?",
    answer:
      "Chaque virement affiche ses étapes : demande enregistrée, contrôles, exécution, fonds crédités. Un virement peut rester en attente le temps des vérifications.",
  },
  {
    id: "transfer-beneficiary",
    category: "transfers",
    question: "Comment ajouter un bénéficiaire ?",
    answer:
      "Depuis la rubrique Virement de votre espace client. L'ajout d'un bénéficiaire peut nécessiter une confirmation de sécurité.",
  },
  {
    id: "docs-upload",
    category: "documents",
    question: "Comment transmettre un document demandé ?",
    answer:
      "Rendez-vous dans l'espace Documents de votre compte : la demande précise le document attendu et permet son dépôt sécurisé.",
  },
  {
    id: "docs-status",
    category: "documents",
    question: "Que signifient les statuts des documents ?",
    answer:
      "Reçu : le document est arrivé. En revue : il est en cours d'examen. Accepté : il est validé. Action requise : un complément est nécessaire.",
  },
  {
    id: "statements-find",
    category: "statements",
    question: "Où trouver mes relevés ?",
    answer:
      "Dans la rubrique Relevés de votre espace client, avec consultation en ligne et téléchargement au format PDF.",
  },
  {
    id: "statements-history",
    category: "statements",
    question: "Puis-je accéder aux relevés anciens ?",
    answer: "Oui, les relevés des périodes précédentes restent disponibles dans votre espace.",
  },
  {
    id: "security-protection",
    category: "security",
    question: "Comment mon compte est-il protégé ?",
    answer:
      "Par une authentification renforcée, la confirmation des opérations sensibles, la gestion des sessions actives et des alertes sur les événements importants.",
  },
  {
    id: "security-phishing",
    category: "security",
    question: "Vaultis peut-il me demander mon mot de passe ?",
    answer:
      "Non. La banque ne demande jamais votre mot de passe, votre code PIN ni un code de vérification, ni par e-mail, ni par téléphone, ni par message.",
  },
  {
    id: "profile-update",
    category: "profile",
    question: "Comment modifier mes coordonnées ?",
    answer:
      "Depuis la rubrique Profil de votre espace client. Certaines modifications nécessitent une vérification supplémentaire.",
  },
  {
    id: "contact-secure",
    category: "contact",
    question: "Comment contacter la banque ?",
    answer:
      "Si vous êtes client, utilisez la messagerie sécurisée de votre espace : elle relie votre demande à son contexte. Sinon, utilisez le formulaire de contact public.",
  },
];

export const CONTACT_TOPICS = [
  "Ouverture de compte",
  "Connexion et accès",
  "Question sur un produit",
  "Sécurité",
  "Informations légales",
  "Autre demande",
] as const;
