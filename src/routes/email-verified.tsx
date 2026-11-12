import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, ArrowRight, ShieldCheck } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { buildOnboardingTasks, nextOnboardingRoute } from "@/features/onboarding/lib/tasks";

export const Route = createFileRoute("/email-verified")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Adresse e-mail confirmée — RFC FINANCE Bank" },
      {
        name: "description",
        content:
          "Votre adresse e-mail est confirmée : découvrez les prochaines étapes de l'ouverture de votre compte.",
      },
      { property: "og:title", content: "Adresse e-mail confirmée — RFC FINANCE Bank" },
      {
        property: "og:description",
        content: "Les prochaines étapes de l'ouverture de votre compte RFC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EmailVerifiedPage,
});

function EmailVerifiedPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
  }, []);
  const query = useCustomerContext({ enabled: hasSession === true });
  const context = query.data;
  const isPending = hasSession === null || (hasSession && query.isLoading);

  const tasks = context ? buildOnboardingTasks(context) : [];
  const visibleTasks = tasks.filter((task) => task.id !== "email");
  const completedCount = tasks.filter((task) => task.status === "done").length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const taskCopy: Record<string, { title: string; description: string }> = en
    ? {
        profile: {
          title: "Personal details",
          description: "Name, date of birth, nationality, country of residence and occupation.",
        },
        contact: {
          title: "Phone verification",
          description: "Confirm your phone number to secure your registration.",
        },
        address: {
          title: "Residential address",
          description: "Provide your complete residential address.",
        },
        documents: {
          title: "Identity documents",
          description:
          "Provide an identity document and proof of address. You may complete this later when your file allows it.",
        },
        review: {
          title: "Application submission",
          description: "Review your information and submit your application for verification.",
        },
        activation: {
          title: "Account opening",
          description: "Account activation follows the separate identity and compliance review.",
        },
      }
    : {};

  const taskStatusLabel = (status: string) => {
    if (en) {
      return status === "done"
        ? "Completed"
        : status === "current"
          ? "To complete now"
          : status === "blocked"
            ? "Can be completed later"
            : "Upcoming";
    }
    return status === "done"
      ? "Terminée"
      : status === "current"
        ? "À compléter maintenant"
        : status === "blocked"
          ? "À compléter ultérieurement"
          : "À venir";
  };

  const next = context ? nextOnboardingRoute(context) : "/onboarding";

  return (
    <AuthShell
      eyebrow={en ? "ACCOUNT OPENING" : "OUVERTURE DU COMPTE"}
      title={en ? "Your email is confirmed" : "Votre adresse e-mail est confirmée"}
      description={
        en
          ? "Welcome to RFC FINANCE Bank. Your registration can now continue securely."
          : "Bienvenue chez RFC FINANCE Bank. Votre inscription peut maintenant se poursuivre en toute sécurité."
      }
      aside={
        <div className="rounded-2xl border border-brand/15 bg-brand/5 p-4 sm:p-5">
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-background text-brand shadow-sm">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <h2 className="text-heading-sm font-semibold text-foreground">
            {en ? "Your information stays protected" : "Vos informations restent protégées"}
          </h2>
          <p className="mt-2 text-body-sm leading-relaxed text-muted-foreground">
            {en
              ? "Continue using your own details and upload only documents that belong to you. Our team will review your application before banking access is enabled."
              : "Continuez avec vos propres informations et déposez uniquement des documents qui vous appartiennent. Notre équipe examinera votre dossier avant l’activation de l’accès bancaire."}
          </p>
        </div>
      }
    >
      <div className="space-y-5">
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success-muted p-4 sm:p-5"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-label font-semibold text-foreground">
                {en ? "Step 1 completed" : "Étape 1 terminée"}
              </p>
              <span className="rounded-full bg-success/10 px-2.5 py-1 text-caption font-medium text-success">
                {en ? "Verified" : "Vérifiée"}
              </span>
            </div>
            <p className="mt-1 text-body-sm text-muted-foreground">
              {en
                ? "Your email address has been successfully confirmed."
                : "Votre adresse e-mail a bien été confirmée."}
            </p>
            {context ? (
              <p className="mt-2 text-body-sm text-muted-foreground">
                {en
                  ? "Registration details received for"
                  : "Premières informations enregistrées pour"}{" "}
                <span className="font-medium text-foreground">
                  {[context.profile.first_name, context.profile.last_name]
                    .filter(Boolean)
                    .join(" ")}
                </span>
                {context.email ? ` · ${context.email}` : ""}
              </p>
            ) : null}
          </div>
        </div>

        {context ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-label font-semibold text-foreground">
                {en ? "Your registration progress" : "Progression de votre inscription"}
              </h2>
              <span className="text-caption tabular-nums text-muted-foreground">
                {completedCount} / {totalCount} {en ? "completed" : "terminées"}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"
              role="progressbar"
              aria-label={en ? "Registration progress" : "Progression de l’inscription"}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-valuenow={completedCount}
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] motion-reduce:transition-none"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <ol className="space-y-3">
              {visibleTasks.map((task, index) => {
                const copy = taskCopy[task.id];
                return (
                  <li
                    key={task.id}
                    className="flex gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand/25 motion-reduce:transition-none"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-caption font-semibold tabular-nums text-muted-foreground">
                      {index + 2}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-label font-medium text-foreground">
                        {copy?.title ?? task.title}
                      </p>
                      <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
                        {copy?.description ?? task.description}
                      </p>
                      <p className="mt-2 text-caption font-medium text-muted-foreground">
                        {taskStatusLabel(task.status)}
                      </p>
                    </div>
                    {task.status === "done" ? (
                      <CheckCircle2
                      className="mt-1 size-4 shrink-0 text-success"
                      aria-label={en ? "Completed" : "Terminée"}
                    />
                    ) : (
                      <Circle
                      className="mt-1 size-4 shrink-0 text-muted-foreground/60"
                      aria-hidden="true"
                    />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : isPending ? (
          <p className="text-body-sm text-muted-foreground">
            {en
              ? "Your registration progress will appear when your details are loaded."
              : "Votre progression apparaîtra dès que les informations de votre dossier seront chargées."}
          </p>
        ) : null}
        {isPending ? (
          <div className="flex justify-center">
            <Spinner className="size-5" />
          </div>
        ) : query.isError && hasSession ? (
          <div className="space-y-3">
            <p role="alert" className="text-body-sm text-destructive">
              {en
                ? "Your email is confirmed, but we could not load your registration details. Your account has not been reset. Please retry."
                : "Votre e-mail est confirmé, mais nous n’avons pas pu charger vos informations d’inscription. Votre dossier n’a pas été réinitialisé. Veuillez réessayer."}
            </p>
            <Button className="w-full touch-target" onClick={() => void query.refetch()}>
              {en ? "Retry loading my application" : "Réessayer de charger mon dossier"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ) : context ? (
          <Button asChild className="w-full touch-target">
            <Link to={next}>
              {en ? "Start the next step" : "Commencer l'étape suivante"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full touch-target">
            <Link to="/login">
              {en ? "Sign in to continue" : "Se connecter pour continuer"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
        {context ? (
          <Button asChild variant="ghost" className="w-full touch-target">
            <Link to="/onboarding">
              {en ? "See my full progress" : "Voir toute ma progression"}
            </Link>
          </Button>
        ) : null}
      </div>
    </AuthShell>
  );
}
