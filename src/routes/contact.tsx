import { createFileRoute, Link } from "@tanstack/react-router";
import { LifeBuoy, MessagesSquare, ShieldCheck } from "lucide-react";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { PageHero } from "@/features/public/components/PageHero";
import { PublicSection, SectionHeader } from "@/features/public/components/SectionHeader";
import { PublicContactForm } from "@/features/public/components/PublicContactForm";
import { publicMeta } from "@/features/public/lib/seo";
import { LEGAL_IDENTITY_NOTICE } from "@/features/public/content/site";
import { LegalIdentityList } from "@/features/public/components/LegalIdentityList";

const meta = publicMeta({
  title: "Contact",
  description:
    "Contactez la banque : messagerie sécurisée pour les clients, formulaire public pour les autres demandes, informations légales de l'entité.",
  path: "/contact",
});

export const Route = createFileRoute("/contact")({
  head: () => meta,
  component: ContactPage,
});

const CHANNELS = [
  {
    icon: MessagesSquare,
    title: "Vous êtes client",
    description:
      "Utilisez la messagerie sécurisée de votre espace : votre demande est rattachée à son contexte et à votre dossier.",
    action: { label: "Accéder à mon espace", to: "/login" as const },
  },
  {
    icon: LifeBuoy,
    title: "Vous cherchez une réponse rapide",
    description: "Le centre d'aide couvre l'ouverture de compte, la connexion, les virements et les documents.",
    action: { label: "Centre d'aide", to: "/help" as const },
  },
  {
    icon: ShieldCheck,
    title: "Vous n'accédez plus à votre compte",
    description:
      "Utilisez le formulaire ci-dessous. Ne transmettez jamais votre mot de passe ni un code de vérification.",
    action: null,
  },
];

function ContactPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Contact"
        title="Parlons de votre demande"
        description="Choisissez le canal adapté à votre situation. Les demandes liées à un compte existant passent par la messagerie sécurisée."
      />

      <PublicSection>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            return (
              <article
                key={channel.title}
                className="flex flex-col rounded-2xl border border-border bg-surface p-5"
              >
                <Icon className="size-6 text-brand" aria-hidden="true" />
                <h2 className="text-heading-sm mt-4 text-foreground">{channel.title}</h2>
                <p className="text-body-sm mt-2 flex-1 text-muted-foreground">{channel.description}</p>
                {channel.action && (
                  <Link
                    to={channel.action.to}
                    className="text-body-sm mt-4 font-medium text-brand underline-offset-4 hover:underline"
                  >
                    {channel.action.label}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </PublicSection>

      <PublicSection tone="sunken">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-w-0">
            <SectionHeader
              as="h2"
              eyebrow="Formulaire public"
              title="Écrire à la banque"
              description="Nous ne demandons que le strict nécessaire : nom, e-mail, sujet et message."
            />
            <div className="mt-6">
              <PublicContactForm />
            </div>
          </div>

          <aside className="min-w-0">
            <h2 className="text-heading-sm text-foreground">Coordonnées de la banque</h2>
            <LegalIdentityList
              variant="summary"
              className="mt-4 rounded-2xl border border-border bg-surface p-5"
            />
            <p className="text-caption mt-4 text-muted-foreground">{LEGAL_IDENTITY_NOTICE}</p>
          </aside>

        </div>
      </PublicSection>
    </PublicLayout>
  );
}
