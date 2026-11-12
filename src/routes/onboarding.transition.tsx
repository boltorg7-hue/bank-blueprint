import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import { nextRouteForLifecycle } from "@/types/customer-lifecycle";

export const Route = createFileRoute("/onboarding/transition")({
  ssr: false,
  head: () => ({
    meta: [
      {
        title: "Préparation de votre espace — RFC",
      },
      {
        name: "robots",
        content: "noindex,nofollow",
      },
    ],
  }),
  component: TransitionPage,
});

/**
 * Transitional screen shown after a successful onboarding submission.
 *
 * SECURITY RULE:
 * This screen is informational only.
 * It must NEVER grant access to the banking dashboard.
 *
 * The final destination is derived from the trusted lifecycle state returned
 * by the server.
 */
function TransitionPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const navigate = useNavigate();

  const { data: context, isPending, isError } = useCustomerContext();

  const [done, setDone] = useState(0);
  const documentsDeferred = Boolean(
    context &&
    context.profile.lifecycle_state === "IDENTITY_REQUIRED" &&
    context.profile.onboarding_step === "COMPLETED" &&
    context.verification.status === "NOT_STARTED",
  );

  const steps = documentsDeferred
    ? en
      ? [
          [ShieldCheck, "Registration details saved"],
          [CheckCircle2, "Documents can be provided later"],
          [Lock, "Banking access locked until identity verification"],
        ]
      : [
          [ShieldCheck, "Informations d'inscription enregistrées"],
          [CheckCircle2, "Documents à transmettre ultérieurement"],
          [Lock, "Accès bancaire verrouillé jusqu'à la vérification d'identité"],
        ]
    : en
      ? [
          [ShieldCheck, "Application received securely"],
          [CheckCircle2, "Identity documents recorded"],
          [Lock, "Operations locked until verification"],
        ]
      : [
          [ShieldCheck, "Dossier reçu en toute sécurité"],
          [CheckCircle2, "Documents d'identité enregistrés"],
          [Lock, "Opérations verrouillées jusqu'à la vérification"],
        ];

  /**
   * Only animate the transition after trusted customer state is available.
   */
  useEffect(() => {
    if (isPending || isError || !context) return;

    if (context.profile.lifecycle_state === "ACTIVE") {
      const timer = window.setTimeout(() => {
        void navigate({
          to: "/app/dashboard",
          replace: true,
        });
      }, 700);

      return () => window.clearTimeout(timer);
    }

    if (done >= steps.length) {
      const destination = nextRouteForLifecycle(context.profile.lifecycle_state);

      const timer = window.setTimeout(() => {
        void navigate({
          to: destination as never,
          replace: true,
        });
      }, 900);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setDone((value) => value + 1);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [context, done, isError, isPending, navigate, steps.length]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-12 shadow-sm sm:px-10">
          <Spinner className="size-7 text-primary" />
          <p className="mt-4 text-body-sm text-muted-foreground">
            {en ? "Preparing your application…" : "Préparation de votre dossier…"}
          </p>
        </div>
      </div>
    );
  }

  if (isError || !context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col justify-center rounded-3xl border border-border bg-card px-6 py-10 shadow-sm sm:px-10">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-4">
            <p className="text-body-sm text-destructive">
              {en
                ? "We could not verify your application status."
                : "Nous n’avons pas pu vérifier l’état de votre dossier."}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full touch-target"
            onClick={() =>
              void navigate({
                to: "/onboarding/status",
                replace: true,
              })
            }
          >
            {en ? "View application status" : "Voir le statut du dossier"}
          </Button>
        </div>
      </div>
    );
  }

  const lifecycle = context.profile.lifecycle_state;
  const progress = lifecycle === "ACTIVE" ? 100 : Math.round((done / steps.length) * 100);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-lg flex-col justify-center rounded-3xl border border-border bg-card px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <div className="mx-auto mb-7 grid size-20 place-items-center rounded-2xl border border-primary/15 bg-primary/10 animate-in zoom-in-75 duration-700">
          <ShieldCheck className="size-10 text-primary" aria-hidden="true" />
        </div>

        <h1 className="text-center text-h2 text-foreground">
          {documentsDeferred
            ? en
              ? "Your registration is saved"
              : "Votre inscription est enregistrée"
            : en
              ? "Your application has been submitted"
              : "Votre dossier a été transmis"}
        </h1>

        <p className="mt-2 text-center text-body-sm text-muted-foreground">
          {documentsDeferred
            ? en
              ? "You can provide the required documents later from your application. Banking access remains locked until identity verification and account activation."
              : "Vous pourrez transmettre les justificatifs requis plus tard depuis votre dossier. L'accès bancaire restera verrouillé jusqu'à la vérification d'identité et l'activation du compte."
            : en
              ? "Your account remains protected while our verification process continues."
              : "Votre compte reste protégé pendant que la vérification de votre dossier se poursuit."}
        </p>

        <div
          className="mt-8 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="mt-7 space-y-3" aria-live="polite">
          {steps.map(([Icon, label], index) => {
            const state = index < done ? "done" : index === done ? "active" : "todo";

            const StepIcon = Icon as typeof ShieldCheck;

            return (
              <li
                key={label as string}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500 ${
                  state === "todo"
                    ? "translate-y-1 border-border opacity-40"
                    : "translate-y-0 opacity-100"
                } ${
                  state === "done"
                    ? "border-success/40 bg-success-muted"
                    : "border-border bg-surface"
                }`}
              >
                {state === "active" ? (
                  <Loader2
                  className="size-5 shrink-0 animate-spin text-primary"
                  aria-hidden="true"
                />
                ) : (
                  <StepIcon
                    className={`size-5 shrink-0 ${
                      state === "done" ? "text-success" : "text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  />
                )}

                <span className="text-body-sm text-foreground">{label as string}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 rounded-2xl border border-border bg-surface px-4 py-4">
          <p className="text-label text-foreground">{en ? "Current status" : "Statut actuel"}</p>

          <p className="mt-1 text-body-sm text-muted-foreground">
            {en
              ? "Your banking operations remain unavailable until the account is fully activated."
              : "Les opérations bancaires restent indisponibles jusqu'à l'activation complète du compte."}
          </p>
        </div>

        <Button
          variant="ghost"
          className="mt-6 w-full touch-target"
          onClick={() =>
            void navigate({
              to: "/onboarding/status",
              replace: true,
            })
          }
        >
          {en ? "View application status" : "Voir le statut de mon dossier"}
        </Button>
      </div>
    </div>
  );
}
