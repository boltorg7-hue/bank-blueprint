import { Link } from "@tanstack/react-router";
import { Clock, Lock } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { CustomerLifecycleState } from "@/types/customer-lifecycle";
import { isPendingVerification } from "@/features/customer-shell/lib/route-access";

/** Explains the limited area while identity/account review is in progress. */
export function LimitedAccessBanner({ state }: { state: CustomerLifecycleState }) {
  const { language } = useLanguage();
  const en = language === "en";
  if (!isPendingVerification(state)) return null;
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
            {en
              ? "You can explore your area, messages and settings. Transfers and transactions unlock once your identity is validated."
              : "Vous pouvez découvrir votre espace, vos messages et vos réglages. Les virements et opérations s'activeront dès la validation de votre identité."}
          </p>
          <Link to="/onboarding/status" className="mt-1 inline-flex min-h-11 items-center text-label text-primary underline-offset-4 hover:underline">
            {en ? "Track my application" : "Suivre mon dossier"}
          </Link>
        </div>
      </div>
    </div>
  );
}
