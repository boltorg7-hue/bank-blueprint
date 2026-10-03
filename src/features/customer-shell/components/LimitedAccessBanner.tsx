import { Link } from "@tanstack/react-router";
import { Clock, Lock } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { CustomerLifecycleState } from "@/types/customer-lifecycle";
import { isPendingVerification } from "@/features/customer-shell/lib/route-access";

/** Explains the limited area while identity/account review is in progress. */
export function LimitedAccessBanner({ state }: { state: CustomerLifecycleState }) {
  const { language } = useLanguage();
  const en = language === "en";
  const pending = isPendingVerification(state);
  const restricted = state === "RESTRICTED";
  const suspended = state === "SUSPENDED";
  if (!pending && !restricted && !suspended) return null;
  const docNeeded = state === "ADDITIONAL_DOCUMENT_REQUIRED";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 animate-in fade-in slide-in-from-top-2 duration-700">
      <div role="status" className="flex items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
        {docNeeded ? <Clock className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" /> : <Lock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />}
        <div className="min-w-0 flex-1">
          <p className="text-label text-foreground">
            {docNeeded
              ? en ? "An additional document is requested" : "Un document complémentaire est demandé"
              : en ? "Limited area — identity verification in progress" : "Espace limité — vérification d'identité en cours"}
          </p>
          <p className="text-body-sm text-muted-foreground">
            {docNeeded
              ? en ? "Add the requested information to continue verification." : "Ajoutez les informations demandées pour poursuivre la vérification."
              : restricted
                ? en ? "Some banking operations are temporarily unavailable. Your available services remain accessible in your banking area." : "Certaines opérations bancaires sont temporairement indisponibles. Les services encore accessibles restent disponibles dans votre espace bancaire."
                : suspended
                  ? en ? "Banking operations are unavailable while the suspension applies. Your available information remains visible." : "Les opérations bancaires sont indisponibles pendant la suspension. Les informations encore accessibles restent visibles."
                  : en ? "You can explore your area, messages and settings. Transfers and transactions unlock once your identity is validated." : "Vous pouvez découvrir votre espace, vos messages et vos réglages. Les virements et opérations s'activeront dès la validation de votre identité."}
          </p>
          <Link to="/onboarding/status" className="mt-1 inline-flex min-h-11 items-center text-label text-primary underline-offset-4 hover:underline">
            {en ? "Track my application" : "Suivre mon dossier"}
          </Link>
        </div>
      </div>
    </div>
  );
}
