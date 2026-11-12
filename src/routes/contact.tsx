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
        eyebrow={en ? "Contact" : "Contact"}
        title={en ? "How can we help?" : "Parlons de votre demande"}
        description={
          en
            ? "Choose the right way to reach us. For existing accounts, use secure messaging."
            : "Choisissez le canal adapté à votre situation. Les demandes liées à un compte existant passent par la messagerie sécurisée."
        }
      />

      <PublicSection className="py-10 sm:py-14">
        <div className="mb-6 flex flex-col gap-2 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-overline text-brand">
              {en ? "Contact options" : "Nos canaux de contact"}
            </p>
            <h2 className="text-heading-lg mt-2 text-foreground">
              {en ? "Choose the right channel" : "Choisissez le bon canal"}
            </h2>
          </div>
          <p className="text-body-sm max-w-md text-muted-foreground">
            {en
              ? "For account-specific questions, secure messaging keeps your request connected to your customer file."
              : "Pour toute question liée à votre compte, la messagerie sécurisée rattache votre demande à votre dossier client."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CHANNELS.map((channel, index) => {
            const Icon = channel.icon;
            return (
              <article
                key={channel.title}
                className="group flex min-w-0 flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-heading-sm mt-5 text-foreground">
                  {en ? CHANNELS_EN[index]?.title : channel.title}
                </h3>
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

      <PublicSection tone="sunken" className="py-10 sm:py-16">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:gap-8">
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
            <div className="mt-6 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-7">
              <PublicContactForm />
            </div>
          </div>

          <aside className="min-w-0 rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-overline text-brand">
                  {en ? "Official information" : "Informations officielles"}
                </p>
                <h2 className="text-heading-sm text-foreground">
                  {en ? "Bank contact details" : "Coordonnées de la banque"}
                </h2>
              </div>
            </div>
            <LegalIdentityList
              variant="summary"
              className="mt-5 rounded-xl border border-border/70 bg-surface-sunken/50 p-4"
            />
            <p className="text-caption mt-4 text-muted-foreground">{LEGAL_IDENTITY_NOTICE}</p>
          </aside>
        </div>
      </PublicSection>
    </PublicLayout>
  );
}
