import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, LineChart, Lock, ShieldCheck, Smartphone } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app";

const TITLE = `${APP_CONFIG.name} — Banque digitale moderne`;
const DESCRIPTION =
  "Ouvrez un compte en quelques minutes, suivez vos opérations en temps réel et effectuez vos virements en toute sécurité avec Vaultis.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Sécurité par architecture",
    body: "Authentification forte, autorisations vérifiées côté serveur et journal d'audit des opérations sensibles.",
  },
  {
    icon: LineChart,
    title: "Comptabilité en partie double",
    body: "Chaque mouvement est enregistré dans un grand livre ; les soldes sont calculés, jamais modifiés à la main.",
  },
  {
    icon: Smartphone,
    title: "Pensé mobile d'abord",
    body: "Une interface conçue à partir de l'écran du smartphone, puis enrichie pour la tablette et le bureau.",
  },
  {
    icon: Lock,
    title: "Connexion permanente",
    body: "Vos informations financières sont toujours issues du serveur : aucune donnée périmée présentée comme actuelle.",
  },
];

function HomePage() {
  return (
    <PublicLayout>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-brand-muted/50 px-3 py-1 text-xs font-medium text-foreground">
              <Building2 className="size-3.5" aria-hidden="true" />
              Plateforme bancaire digitale
            </span>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              {APP_CONFIG.tagline}
            </h1>
            <p className="max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg">
              {DESCRIPTION}
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button asChild size="lg" className="touch-target">
                <Link to="/app/dashboard">Découvrir l'espace client</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="touch-target">
                <Link to="/admin/dashboard">Accès collaborateur</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Les fondations de la plateforme
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Les parcours d'ouverture de compte, les virements et le centre de documents arrivent au
          fil des prochaines phases de construction.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <li
                key={pillar.title}
                className="rounded-xl border border-border bg-surface p-5 shadow-subtle"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-lg bg-brand-muted text-brand"
                  aria-hidden="true"
                >
                  <Icon className="size-4.5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {pillar.body}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </PublicLayout>
  );
}
