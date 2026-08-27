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
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Not yet implemented — the destination shell may be a placeholder. */
  upcoming?: boolean;
};

/** Public marketing navigation (pages are built in PROMPT 02). */
export const PUBLIC_NAV: NavItem[] = [
  { label: "Accueil", to: "/", icon: Home },
  { label: "Comptes", to: "/", icon: Wallet, upcoming: true },
  { label: "Sécurité", to: "/", icon: ShieldCheck, upcoming: true },
  { label: "À propos", to: "/", icon: Building2, upcoming: true },
];

/** Primary mobile destinations — never more than five. */
export const CUSTOMER_PRIMARY_NAV: NavItem[] = [
  { label: "Accueil", to: "/app/dashboard", icon: Home },
  { label: "Comptes", to: "/app/dashboard", icon: Wallet, upcoming: true },
  { label: "Virement", to: "/app/dashboard", icon: Send, upcoming: true },
  { label: "Activité", to: "/app/dashboard", icon: ListOrdered, upcoming: true },
  { label: "Plus", to: "/app/dashboard", icon: LayoutGrid, upcoming: true },
];

/** Desktop sidebar — customer destinations only, never admin functions. */
export const CUSTOMER_DESKTOP_NAV: NavItem[] = [
  { label: "Accueil", to: "/app/dashboard", icon: Home },
  { label: "Comptes", to: "/app/dashboard", icon: Wallet, upcoming: true },
  { label: "Virement", to: "/app/dashboard", icon: Send, upcoming: true },
  { label: "Activité", to: "/app/dashboard", icon: ListOrdered, upcoming: true },
  { label: "Relevés", to: "/app/dashboard", icon: FileText, upcoming: true },
  { label: "Messages", to: "/app/dashboard", icon: MessagesSquare, upcoming: true },
];

export const CUSTOMER_SECONDARY_NAV: NavItem[] = [
  { label: "Notifications", to: "/app/dashboard", icon: Bell, upcoming: true },
  { label: "Profil", to: "/app/dashboard", icon: UserRound, upcoming: true },
  { label: "Sécurité", to: "/app/dashboard", icon: Lock, upcoming: true },
  { label: "Aide", to: "/app/dashboard", icon: LifeBuoy, upcoming: true },
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
