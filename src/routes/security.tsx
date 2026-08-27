import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { CtaSection } from "@/features/public/components/CtaSection";
import { publicMeta } from "@/features/public/lib/seo";
import {
  CUSTOMER_RESPONSIBILITIES,
  SECURITY_INTRO,
  SECURITY_PROTECTIONS,
  SUSPICIOUS_ACTIVITY_STEPS,
} from "@/features/public/content/security";
import { SECURITY_WARNING } from "@/features/public/content/site";

const meta = publicMeta({
  title: "Sécurité de votre compte",
  description:
    "Authentification renforcée, gestion des sessions, confirmation des opérations sensibles et alertes d'activité : comment votre compte est protégé.",
  path: "/security",
});

export const Route = createFileRoute("/security")({
  head: () => meta,
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Sécurité"
        title={SECURITY_INTRO.title}
        description={SECURITY_INTRO.description}
        aside={
          <div className="flex gap-3 rounded-2xl border border-warning/30 bg-warning-muted p-5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
            <p className="text-body-sm text-foreground">{SECURITY_WARNING}</p>
          </div>
        }
      />

      <PublicSection>
        <SectionHeader
          eyebrow="Nos protections"
          title="Ce que la banque met en place"
          description="Ces explications restent au niveau du client : aucun détail technique exploitable n'est publié."
        />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_PROTECTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
              >
                <Icon className="size-6 text-brand" aria-hidden="true" />
                <h3 className="text-heading-sm mt-4 text-foreground">{item.title}</h3>
                <p className="text-body-sm mt-2 text-muted-foreground">{item.description}</p>
              </article>
            );
          })}
        </div>
      </PublicSection>

      <PublicSection tone="sunken">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
          <div className="min-w-0">
            <SectionHeader as="h2" eyebrow="Votre rôle" title="Ce que vous pouvez faire" />
            <ul className="mt-5 space-y-3">
              {CUSTOMER_RESPONSIBILITIES.map((item) => (
                <li key={item} className="text-body-sm flex gap-2 text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <SectionHeader as="h2" eyebrow="En cas de doute" title="Activité suspecte : les étapes" />
            <ol className="mt-5 space-y-3">
              {SUSPICIOUS_ACTIVITY_STEPS.map((step, index) => (
                <li
                  key={step}
                  className="text-body-sm flex gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-foreground"
                >
                  <span className="text-numeric text-caption inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </PublicSection>

      <CtaSection
        title="Ouvrir un compte protégé dès la première connexion"
        description="La vérification en deux étapes et la gestion des sessions sont disponibles dès l'activation du compte."
      />
    </PublicLayout>
  );
}
