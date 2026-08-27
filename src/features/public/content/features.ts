/**
 * FEATURES PAGE CONTENT (PROMPT 02 §33-§34).
 * Only customer-facing capabilities — never administration features.
 */
import {
  Activity,
  BellRing,
  FileText,
  FolderCheck,
  MessagesSquare,
  Send,
  ShieldCheck,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type FeatureCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  intro: string;
  items: { title: string; description: string }[];
};

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "accounts",
    label: "Comptes",
    icon: Wallet,
    intro: "Une vision précise de votre compte courant et de sa disponibilité.",
    items: [
      { title: "Solde disponible", description: "Le montant réellement utilisable, distinct du solde comptable." },
      { title: "Vue d'ensemble", description: "Entrées, sorties et opérations en attente sur une même page." },
      { title: "Coordonnées bancaires", description: "IBAN masqué par défaut, révélé et copiable à la demande." },
    ],
  },
  {
    id: "transfers",
    label: "Virements",
    icon: Send,
    intro: "Des virements guidés, avec récapitulatif avant confirmation.",
    items: [
      { title: "Bénéficiaires enregistrés", description: "Ajoutez et retrouvez vos bénéficiaires vérifiés." },
      { title: "Récapitulatif clair", description: "Montant, frais éventuels et délai affichés avant validation." },
      { title: "Suivi d'exécution", description: "Chaque étape du virement est visible jusqu'au crédit des fonds." },
    ],
  },
  {
    id: "activity",
    label: "Activité",
    icon: Activity,
    intro: "Comprendre l'historique du compte sans effort.",
    items: [
      { title: "Historique complet", description: "Toutes les opérations, avec leur statut et leur référence." },
      { title: "Filtres utiles", description: "Par période, par sens de l'opération et par statut." },
      { title: "Détail d'opération", description: "Contexte complet d'une écriture, pièces et messages liés." },
    ],
  },
  {
    id: "statements",
    label: "Relevés",
    icon: FileText,
    intro: "Des relevés numériques disponibles quand vous en avez besoin.",
    items: [
      { title: "Relevés périodiques", description: "Consultation en ligne des relevés de compte." },
      { title: "Téléchargement PDF", description: "Un document propre, imprimable et archivable." },
      { title: "Historique conservé", description: "Accès aux relevés des périodes précédentes." },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    icon: FolderCheck,
    intro: "Un espace sécurisé pour transmettre et suivre vos documents.",
    items: [
      { title: "Dépôt sécurisé", description: "Transmission des documents demandés depuis votre espace." },
      { title: "Statuts de revue", description: "Reçu, en revue, accepté ou action requise." },
      { title: "Organisation", description: "Vos documents bancaires classés et retrouvables." },
    ],
  },
  {
    id: "messaging",
    label: "Messagerie",
    icon: MessagesSquare,
    intro: "Un canal d'échange rattaché au contexte de votre demande.",
    items: [
      { title: "Messagerie sécurisée", description: "Vos échanges restent dans votre espace client." },
      { title: "Conversation contextualisée", description: "Liée à une opération, un document ou une question." },
      { title: "Historique", description: "Retrouvez les réponses déjà apportées." },
    ],
  },
  {
    id: "security",
    label: "Sécurité",
    icon: ShieldCheck,
    intro: "Des protections visibles et actionnables.",
    items: [
      { title: "Authentification renforcée", description: "Seconde vérification à la connexion et sur les actions sensibles." },
      { title: "Sessions et appareils", description: "Consultez et fermez vos sessions actives." },
      { title: "Journal d'activité", description: "Les événements de sécurité de votre compte sont consultables." },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: BellRing,
    intro: "Être informé au bon moment, sans bruit inutile.",
    items: [
      { title: "Alertes d'opération", description: "Information sur les mouvements importants." },
      { title: "Alertes de sécurité", description: "Nouvelle connexion ou changement sensible." },
      { title: "Demandes en attente", description: "Rappel lorsqu'une action est requise de votre part." },
    ],
  },
  {
    id: "profile",
    label: "Profil et accès",
    icon: UserRound,
    intro: "Vos informations et vos réglages, sous votre contrôle.",
    items: [
      { title: "Coordonnées", description: "Mise à jour de vos informations de contact." },
      { title: "Préférences", description: "Langue d'affichage, thème et confidentialité des montants." },
      { title: "Contrôles d'accès", description: "Mot de passe et méthodes de vérification." },
    ],
  },
];
