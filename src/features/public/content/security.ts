/**
 * SECURITY PAGE CONTENT (PROMPT 02 §36-§37).
 *
 * Customer-level explanations only. Never publish internal architecture,
 * detection rules, thresholds, keys or database policies.
 */
import {
  BellRing,
  FileCheck2,
  KeyRound,
  Lock,
  MonitorSmartphone,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

export const SECURITY_INTRO = {
  title: "La sécurité de votre compte",
  description:
    "RFC protège l'accès à votre compte, vos opérations et vos documents. Voici ce que nous mettons en place et ce que vous pouvez contrôler.",
} as const;

export const SECURITY_PROTECTIONS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Authentification",
    description:
      "L'accès à votre espace nécessite vos identifiants personnels. Les tentatives échouées répétées entraînent des protections supplémentaires.",
    icon: KeyRound,
  },
  {
    title: "Vérification en deux étapes",
    description:
      "Une seconde vérification peut être demandée à la connexion et avant les opérations sensibles.",
    icon: ShieldCheck,
  },
  {
    title: "Appareils et sessions",
    description:
      "Vous consultez les sessions actives sur votre compte et pouvez fermer celles que vous ne reconnaissez pas.",
    icon: MonitorSmartphone,
  },
  {
    title: "Confirmation des opérations sensibles",
    description:
      "Un virement ou une modification importante demande une confirmation explicite de votre part.",
    icon: UserCheck,
  },
  {
    title: "Documents sécurisés",
    description:
      "Les documents que vous transmettez sont conservés dans votre espace et accessibles uniquement aux traitements autorisés.",
    icon: FileCheck2,
  },
  {
    title: "Confidentialité des données",
    description:
      "Vos données ne sont utilisées que pour la gestion de votre relation bancaire et les obligations qui s'y rattachent.",
    icon: Lock,
  },
  {
    title: "Alertes d'activité",
    description:
      "Les événements importants — connexion, opération, changement de sécurité — vous sont signalés.",
    icon: BellRing,
  },
];

export const CUSTOMER_RESPONSIBILITIES: string[] = [
  "Choisissez un mot de passe unique, utilisé uniquement pour RFC.",
  "Ne communiquez jamais votre mot de passe, votre code PIN ni un code de vérification.",
  "Vérifiez l'adresse du site avant de saisir vos identifiants.",
  "Maintenez votre téléphone et votre navigateur à jour.",
  "Fermez les sessions ouvertes sur un appareil que vous n'utilisez plus.",
];

export const SUSPICIOUS_ACTIVITY_STEPS: string[] = [
  "Changez immédiatement votre mot de passe depuis votre espace client.",
  "Fermez les sessions actives que vous ne reconnaissez pas.",
  "Signalez l'incident via la messagerie sécurisée de votre espace client.",
  "Si vous n'avez plus accès à votre compte, utilisez le formulaire de contact public.",
];
