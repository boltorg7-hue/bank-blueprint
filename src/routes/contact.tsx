import { createFileRoute, Link } from "@tanstack/react-router";
import { useLanguage } from "@/components/providers/LanguageProvider";

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
    description:
      "Le centre d'aide couvre l'ouverture de compte, la connexion, les virements et les documents.",
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

const CHANNELS_EN = [
  {
    title: "Already a customer?",
    description: "Use secure messaging in your account so your request is linked to your records.",
    label: "Go to my account",
  },
  {
    title: "Looking for a quick answer?",
    description: "The help center covers account opening, sign-in, transfers and documents.",
    label: "Help center",
  },
  {
    title: "Cannot access your account?",
    description: "Use the form below. Never send a password or verification code.",
    label: "",
  },
];
function ContactPage() {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <PublicLayout showFooter={false}>
      <PageHero
        eyebrow="Contact"
        title={en ? "How can we help?" : "Parlons de votre demande"}
        description={
          en
            ? "Choose the right way to reach us. For existing accounts, use secure messaging."
            : "Choisissez le canal adapté à votre situation. Les demandes liées à un compte existant passent par la messagerie sécurisée."
        }
      />

      <PublicSection>
        <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span className="font-medium uppercase tracking-[0.16em]">{en ? "Choose your channel" : "Choisissez votre canal"}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
          {CHANNELS.map((channel, index) => {
            const Icon = channel.icon;
            return (
              <article
                key={channel.title}
                className="group relative flex min-h-60 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none sm:p-6"

              >
                <div className="flex size-12 items-center justify-center rounded-2xl border border-brand/10 bg-brand/10 text-brand transition-colors duration-200 group-hover:bg-brand/15 motion-reduce:transition-none">
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <h2 className="text-heading-sm mt-5 text-foreground">
                  {en ? CHANNELS_EN[index]?.title : channel.title}
                </h2>
                <p className="text-body-sm mt-2 flex-1 text-muted-foreground">
                  {en ? CHANNELS_EN[index]?.description : channel.description}
                </p>
                {channel.action && (
                  <Link
                    to={channel.action.to}
                    className="text-body-sm mt-5 inline-flex min-h-10 w-fit items-center rounded-lg px-2 font-semibold text-brand underline-offset-4 transition-colors hover:bg-brand/5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {en ? CHANNELS_EN[index]?.label : channel.action.label}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </PublicSection>

      <PublicSection tone="sunken">
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:gap-10">
          <div className="min-w-0">
            <SectionHeader
              as="h2"
              eyebrow={en ? "Public form" : "Formulaire public"}
              title={en ? "Write to the bank" : "Écrire à la banque"}
              description={
                en
                  ? "We only ask for what is needed: your name, email, topic and message."
                  : "Nous ne demandons que le strict nécessaire : nom, e-mail, sujet et message."
              }
            />
            <div className="mt-6 rounded-2xl border border-border/80 bg-card p-4 shadow-md shadow-black/[0.03] sm:p-7">
              <PublicContactForm />
            </div>
          </div>

          <aside className="min-w-0 rounded-2xl border border-border/80 bg-card p-5 shadow-md shadow-black/[0.03] sm:p-6">
            <h2 className="text-heading-sm text-foreground">
              {en ? "Bank contact details" : "Coordonnées de la banque"}
            </h2>
            <LegalIdentityList
              variant="summary"
              className="mt-4 rounded-xl border border-border/70 bg-surface-sunken/50 p-4"
            />
            <p className="text-caption mt-4 text-muted-foreground">{LEGAL_IDENTITY_NOTICE}</p>
          </aside>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
