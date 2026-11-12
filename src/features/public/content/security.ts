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
    "Votre espace sécurité vous permet de mettre à jour votre mot de passe, de consulter les sessions enregistrées et de suivre les événements de sécurité.",
} as const;

export const SECURITY_PROTECTIONS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Accès personnel",
    description: "L'accès à votre espace est personnel et s'effectue avec vos identifiants.",
    icon: KeyRound,
  },
  {
    title: "Vérification des coordonnées",
    description:
      "Les étapes de vérification de votre adresse e-mail et de votre numéro de téléphone contribuent à sécuriser la création et le suivi de votre compte.",
    icon: ShieldCheck,
  },
  {
    title: "Sessions et appareils",
    description:
      "Votre espace sécurité présente les sessions enregistrées par l'application et vous permet de fermer les autres sessions.",
    icon: MonitorSmartphone,
  },
  {
    title: "Gestion du mot de passe",
    description:
      "Vous pouvez modifier votre mot de passe après vérification de votre mot de passe actuel.",
    icon: UserCheck,
  },
  {
    title: "Documents du dossier",
    description:
      "Les documents transmis accompagnent les étapes de vérification et le suivi de votre dossier.",
    icon: FileCheck2,
  },
  {
    title: "Confidentialité des informations",
    description:
      "Les informations de votre dossier sont utilisées pour gérer votre relation avec RFC et assurer les vérifications liées aux services.",
    icon: Lock,
  },
  {
    title: "Historique de sécurité",
    description:
      "Les changements de mot de passe et les événements de sécurité enregistrés sont consultables dans votre espace.",
    icon: BellRing,
  },
];

export const CUSTOMER_RESPONSIBILITIES: string[] = [
  "Choisissez un mot de passe unique, utilisé uniquement pour RFC.",
  "Ne communiquez jamais votre mot de passe, votre code PIN ni un code de vérification.",
  "Vérifiez l'adresse du site avant de saisir vos identifiants.",
  "Maintenez votre téléphone et votre navigateur à jour.",
  "Depuis votre espace sécurité, fermez les autres sessions si vous ne reconnaissez pas un appareil.",
];

export const SUSPICIOUS_ACTIVITY_STEPS: string[] = [
  "Changez immédiatement votre mot de passe depuis votre espace client.",
  "Fermez les sessions actives que vous ne reconnaissez pas.",
  "Signalez l'incident via la messagerie sécurisée de votre espace client.",
  "Si vous n'avez plus accès à votre compte, utilisez le formulaire de contact public.",
];

export const SECURITY_CONTENT_EN = {
  intro: {
    title: "Your account security",
    description:
      "Your security area lets you update your password, review sessions recorded by the application and follow security events.",
  },
  protections: [
    ["Personal access", "Access to your account is personal and uses your sign-in credentials."],
    [
      "Contact verification",
      "Verification steps for your email address and phone number help secure account registration and follow-up.",
    ],
    [
      "Sessions and devices",
      "Your security area shows sessions recorded by the application and lets you close other sessions.",
    ],
    ["Password management", "You can change your password after verifying your current password."],
    [
      "Account documents",
      "Submitted documents support the verification steps and the follow-up of your customer file.",
    ],
    [
      "Information privacy",
      "Your account information is used to manage your relationship with RFC and carry out service-related checks.",
    ],
    [
      "Security history",
      "Password changes and recorded security events can be reviewed in your account.",
    ],
  ],
  responsibilities: [
    "Choose a unique password used only for RFC.",
    "Never share your password, PIN or verification code.",
    "Check the website address before entering your credentials.",
    "Keep your phone and browser up to date.",
    "Use your security area to close other sessions if you do not recognize a device.",
  ],
  steps: [
    "Change your password immediately from your customer account.",
    "Close any active sessions you do not recognize.",
    "Report the incident through your secure customer messaging.",
    "If you can no longer access your account, use the public contact form.",
  ],
} as const;
