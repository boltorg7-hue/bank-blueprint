import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SECURITY_CONTENT_EN } from "@/features/public/content/security";

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
  const { language } = useLanguage();
  const en = language === "en";
  const intro = en ? SECURITY_CONTENT_EN.intro : SECURITY_INTRO;
  const responsibilities = en ? SECURITY_CONTENT_EN.responsibilities : CUSTOMER_RESPONSIBILITIES;
  const steps = en ? SECURITY_CONTENT_EN.steps : SUSPICIOUS_ACTIVITY_STEPS;

  return (
    <PublicLayout>
      <PageHero
        eyebrow={en ? "Security" : "Sécurité"}
        title={intro.title}
        description={intro.description}
        aside={
          <div className="relative overflow-hidden rounded-2xl border border-warning/30 bg-warning-muted p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div
              className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full border border-warning/15"
              aria-hidden="true"
            />
            <div className="relative flex gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                <AlertTriangle className="size-5 text-warning" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-overline text-warning">
                  {en ? "Important reminder" : "Rappel important"}
                </p>
                <p className="text-body-sm mt-2 text-foreground">
                  {en ? "Never share your password or a verification code." : SECURITY_WARNING}
                </p>
              </div>
            </div>
          </div>
        }
      />

      <PublicSection>
        <SectionHeader
          eyebrow={en ? "Our protections" : "Nos protections"}
          title={en ? "How the bank protects you" : "Ce que la banque met en place"}
          description={
            en
              ? "The security actions and information available in your customer account."
              : "Les actions et les informations de sécurité accessibles depuis votre espace client."
          }
        />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_PROTECTIONS.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="group rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-brand/35 hover:shadow-[var(--shadow-elevated)] motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand/10 transition-colors duration-200 group-hover:bg-brand/15 motion-reduce:transition-none">
                  <Icon className="size-5 text-brand" aria-hidden="true" />
                </span>
                <h3 className="text-heading-sm mt-5 text-foreground">
                  {en ? SECURITY_CONTENT_EN.protections[index]?.[0] : item.title}
                </h3>
                <p className="text-body-sm mt-2 text-muted-foreground">
                  {en ? SECURITY_CONTENT_EN.protections[index]?.[1] : item.description}
                </p>
              </article>
            );
          })}
        </div>
      </PublicSection>

      <PublicSection tone="sunken">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="min-w-0">
            <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl border border-border bg-surface shadow-[var(--shadow-subtle)]">
              <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
            </div>
            <SectionHeader
              as="h2"
              eyebrow={en ? "Your role" : "Votre rôle"}
              title={en ? "What you can do" : "Ce que vous pouvez faire"}
            />
            <ul className="mt-5 space-y-3">
              {responsibilities.map((item) => (
                <li
                  key={item}
                  className="text-body-sm flex items-start gap-3 rounded-xl border border-border/70 bg-surface/80 px-4 py-3 text-foreground"
                >
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10">
                    <Check className="size-3.5 text-success" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl border border-border bg-surface shadow-[var(--shadow-subtle)]">
              <AlertTriangle className="size-5 text-warning" aria-hidden="true" />
            </div>
            <SectionHeader
              as="h2"
              eyebrow={en ? "If in doubt" : "En cas de doute"}
              title={en ? "Suspicious activity: what to do" : "Activité suspecte : les étapes"}
            />
            <ol className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <li
                  key={step}
                  className="text-body-sm flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-4 text-foreground shadow-[var(--shadow-subtle)] transition-[border-color,box-shadow] duration-200 hover:border-brand/30 hover:shadow-[var(--shadow-card)] motion-reduce:transition-none"
                >
                  <span className="text-numeric inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-caption font-semibold text-brand-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </PublicSection>

      <CtaSection
        title={en ? "Stay in control of your account access" : "Gardez le contrôle de vos accès"}
        description={
          en
            ? "Update your password, review recorded sessions and close other sessions from your security area."
            : "Modifiez votre mot de passe, consultez les sessions enregistrées et fermez les autres sessions depuis votre espace sécurité."
        }
      />
    </PublicLayout>
  );
}
