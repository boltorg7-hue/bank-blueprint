/** Context titles for the authenticated header (§17). Safe, non-sensitive. */
const TITLES: { prefix: string; title: string }[] = [
  { prefix: "/app/dashboard", title: "Accueil" },
  { prefix: "/app/accounts", title: "Comptes" },
  { prefix: "/app/activity", title: "Activité" },
  { prefix: "/app/transactions", title: "Opérations" },
  { prefix: "/app/transfers", title: "Virements" },
  { prefix: "/app/beneficiaries", title: "Bénéficiaires" },
  { prefix: "/app/statements", title: "Relevés" },
  { prefix: "/app/documents", title: "Documents" },
  { prefix: "/app/messages", title: "Messages" },
  { prefix: "/app/notifications", title: "Notifications" },
  { prefix: "/app/profile", title: "Profil" },
  { prefix: "/app/security", title: "Sécurité" },
  { prefix: "/app/settings", title: "Préférences" },
  { prefix: "/app/more", title: "Plus" },
];

export function contextTitleFor(pathname: string): string {
  const match = TITLES.filter((entry) => pathname.startsWith(entry.prefix)).sort(
    (a, b) => b.prefix.length - a.prefix.length,
  )[0];
  return match?.title ?? "Espace client";
}
