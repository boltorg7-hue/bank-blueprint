import {
  BadgeCheck,
  Banknote,
  Bell,
  Building2,
  FileText,
  Gauge,
  Home,
  LayoutGrid,
  LifeBuoy,
  ListOrdered,
  Lock,
  MessagesSquare,
  Send,
  Settings,
  ShieldCheck,
  Sliders,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { AppPath } from "@/lib/routing";

export type NavItem = {
  label: string;
  to: AppPath;
  icon: LucideIcon;
  /** Destination exists as a shell; the domain engine arrives in a later phase. */
  upcoming?: boolean;
  /** Requires transactional capability (banking status ACTIVE). */
  transactional?: boolean;
};

/** Public marketing navigation (pages are built in PROMPT 02). */
export const PUBLIC_NAV: NavItem[] = [
  { label: "Accueil", to: "/", icon: Home },
  { label: "Comptes", to: "/accounts", icon: Wallet },
  { label: "Sécurité", to: "/security", icon: ShieldCheck },
  { label: "À propos", to: "/about", icon: Building2 },
];

/** Primary mobile destinations — never more than five (§5, §6). */
export const CUSTOMER_PRIMARY_NAV: NavItem[] = [
  { label: "Accueil", to: "/app/dashboard", icon: Home },
  { label: "Comptes", to: "/app/accounts", icon: Wallet },
  { label: "Virement", to: "/app/transfers/new", icon: Send, transactional: true },
  { label: "Activité", to: "/app/activity", icon: ListOrdered },
  { label: "Plus", to: "/app/more", icon: LayoutGrid },
];

/** Desktop sidebar — customer destinations only, never admin functions (§14). */
export const CUSTOMER_DESKTOP_NAV: NavItem[] = [
  { label: "Accueil", to: "/app/dashboard", icon: Home },
  { label: "Comptes", to: "/app/accounts", icon: Wallet },
  { label: "Virement", to: "/app/transfers", icon: Send, transactional: true },
  { label: "Activité", to: "/app/activity", icon: ListOrdered },
  { label: "Bénéficiaires", to: "/app/beneficiaries", icon: Users, transactional: true },
  { label: "Relevés", to: "/app/statements", icon: FileText },
  { label: "Documents", to: "/app/documents", icon: FileText },
  { label: "Messages", to: "/app/messages", icon: MessagesSquare },
];

export const CUSTOMER_SECONDARY_NAV: NavItem[] = [
  { label: "Notifications", to: "/app/notifications", icon: Bell },
  { label: "Profil", to: "/app/profile", icon: UserRound },
  { label: "Sécurité", to: "/app/security", icon: Lock },
  { label: "Préférences", to: "/app/settings", icon: Sliders },
  { label: "Aide", to: "/help", icon: LifeBuoy },
];

/** Grouped secondary destinations for the mobile “Plus” screen (§11). */
export const CUSTOMER_MORE_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Banque",
    items: [
      { label: "Bénéficiaires", to: "/app/beneficiaries", icon: Users, transactional: true },
      { label: "Virements", to: "/app/transfers", icon: Send, transactional: true },
      { label: "Opérations", to: "/app/transactions", icon: ListOrdered },
    ],
  },
  {
    title: "Documents",
    items: [
      { label: "Relevés", to: "/app/statements", icon: FileText },
      { label: "Documents", to: "/app/documents", icon: FileText },
    ],
  },
  {
    title: "Échanges",
    items: [
      { label: "Messages", to: "/app/messages", icon: MessagesSquare },
      { label: "Notifications", to: "/app/notifications", icon: Bell },
    ],
  },
  {
    title: "Mon compte",
    items: [
      { label: "Profil", to: "/app/profile", icon: UserRound },
      { label: "Sécurité", to: "/app/security", icon: Lock },
      { label: "Préférences", to: "/app/settings", icon: Sliders },
      { label: "Aide", to: "/help", icon: LifeBuoy },
    ],
  },
];

/** Administration console navigation (built out in PROMPT 12+). */
export const ADMIN_NAV: NavItem[] = [
  { label: "Tableau de bord", to: "/admin/dashboard", icon: Gauge },
  { label: "Clients", to: "/admin/dashboard", icon: Users, upcoming: true },
  { label: "Comptes", to: "/admin/dashboard", icon: Wallet, upcoming: true },
  { label: "Opérations", to: "/admin/dashboard", icon: Banknote, upcoming: true },
  { label: "KYC & conformité", to: "/admin/dashboard", icon: BadgeCheck, upcoming: true },
  { label: "Audit", to: "/admin/dashboard", icon: FileText, upcoming: true },
  { label: "Paramètres", to: "/admin/dashboard", icon: Settings, upcoming: true },
];
