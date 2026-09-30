import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/onboarding/transition")({
  ssr: false,
  head: () => ({ meta: [{ title: "Préparation de votre espace — RFC" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: TransitionPage,
});

const STEP_MS = 900;

/** Animated, progressive hand-off from the application to the (limited) customer area. */
function TransitionPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const navigate = useNavigate();
  const [done, setDone] = useState(0);

  const steps = en
    ? [
        [ShieldCheck, "Application received securely"],
        [CheckCircle2, "Identity documents recorded"],
        [Lock, "Operations locked until verification"],
        [Sparkles, "Your customer area is ready"],
      ]
    : [
        [ShieldCheck, "Dossier reçu en toute sécurité"],
        [CheckCircle2, "Documents d'identité enregistrés"],
        [Lock, "Opérations verrouillées jusqu'à la vérification"],
        [Sparkles, "Votre espace client est prêt"],
      ];

  useEffect(() => {
    if (done >= steps.length) {
      const t = setTimeout(() => void navigate({ to: "/app/dashboard", replace: true }), 1100);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDone((d) => d + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [done, steps.length, navigate]);

  const progress = Math.round((done / steps.length) * 100);

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="mx-auto mb-8 grid size-20 place-items-center rounded-full bg-primary/10 animate-in zoom-in-75 duration-700">
        <ShieldCheck className="size-10 text-primary" aria-hidden="true" />
      </div>
      <h1 className="text-center text-h2 text-foreground animate-in fade-in slide-in-from-bottom-2 duration-700">
        {en ? "Thank you, your application is sent" : "Merci, votre dossier est envoyé"}
      </h1>
      <p className="mt-2 text-center text-body-sm text-muted-foreground">
        {en ? "We're preparing your customer area." : "Nous préparons votre espace client."}
      </p>

      <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <ol className="mt-6 space-y-3" aria-live="polite">
        {steps.map(([Icon, label], i) => {
          const state = i < done ? "done" : i === done ? "active" : "todo";
          const StepIcon = Icon as typeof ShieldCheck;
          return (
            <li
              key={label as string}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500 ${
                state === "todo" ? "translate-y-1 border-border opacity-40" : "translate-y-0 opacity-100"
              } ${state === "done" ? "border-success/40 bg-success-muted" : "border-border bg-surface"}`}
            >
              {state === "active" ? (
                <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
              ) : (
                <StepIcon className={`size-5 shrink-0 ${state === "done" ? "text-success" : "text-muted-foreground"}`} aria-hidden="true" />
              )}
              <span className="text-body-sm text-foreground">{label as string}</span>
            </li>
          );
        })}
      </ol>

      <Button variant="ghost" className="mt-8 touch-target" onClick={() => void navigate({ to: "/app/dashboard", replace: true })}>
        {en ? "Go to my area now" : "Accéder à mon espace maintenant"}
      </Button>
    </div>
  );
}
