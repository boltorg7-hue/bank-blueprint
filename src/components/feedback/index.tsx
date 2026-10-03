import { useLanguage } from "@/components/providers/LanguageProvider";
import { AlertTriangle, Clock, Inbox, Loader2, ShieldOff, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { StateBlock } from "./StateBlock";

export { StateBlock };
export type { StateTone } from "./StateBlock";

/** Inline loading indicator with an accessible live region. */
export function LoadingState({
  label = "Chargement…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-24 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-8 text-sm text-muted-foreground",\n        "motion-safe:transition-opacity motion-safe:duration-200 motion-reduce:transition-none",
        className,
      )}
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span>{en && label === "Chargement…" ? "Loading…" : label}</span>
    </div>
  );
}

/** Skeleton placeholder for content whose shape is known. */
export function SkeletonBlock({ lines = 3, className }: { lines?: number | undefined; className?: string | undefined }) {
  return (
    <div className={cn("space-y-3 motion-safe:transition-opacity motion-safe:duration-200", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn("h-4 w-full", index === lines - 1 && "w-2/3")} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string | undefined;
  action?: React.ReactNode | undefined;
}) {
  return (
    <StateBlock icon={Inbox} title={title} description={description} actions={action} />
  );
}

export function ErrorState({
  title = "Cette information n'a pas pu être chargée",
  description = "Une erreur est survenue de notre côté. Vous pouvez réessayer dans un instant.",
  onRetry,
}: {
  title?: string | undefined;
  description?: string | undefined;
  onRetry?: (() => void) | undefined;
}) {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <StateBlock
      icon={AlertTriangle}
      tone="danger"
      title={en && title === "Cette information n'a pas pu être chargée" ? "This information could not be loaded" : title}
      description={en && description.startsWith("Une erreur est survenue") ? "Something went wrong. Please try again shortly." : description}
      actions={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            {en ? "Try again" : "Réessayer"}
          </Button>
        ) : undefined
      }
    />
  );
}

/**
 * Network unavailable state. The application is online-first: banking data is
 * never served from a stale local cache as if it were current.
 */
export function NetworkUnavailableState({ onRetry }: { onRetry?: (() => void) | undefined }) {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <StateBlock
      icon={WifiOff}
      tone="warning"
      title={en ? "Connection unavailable" : "Connexion indisponible"}
      description={en ? "Your banking information requires a connection. Transactions cannot be made offline." : "Vos informations bancaires nécessitent une connexion active. Aucune opération n’est enregistrée hors ligne."}
      actions={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            {en ? "Try again" : "Réessayer"}
          </Button>
        ) : undefined
      }
    />
  );
}

export function PermissionDeniedState({ description }: { description?: string | undefined }) {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <StateBlock
      icon={ShieldOff}
      tone="warning"
      title={en ? "Access denied" : "Accès non autorisé"}
      description={
        description ??
        (en ? "You do not have permission to view this section." : "Vous n’avez pas les autorisations nécessaires pour consulter cette section.")
      }
    />
  );
}

export function SessionExpiredState({ onSignIn }: { onSignIn?: (() => void) | undefined }) {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <StateBlock
      icon={Clock}
      tone="info"
      title={en ? "Your session has expired" : "Votre session a expiré"}
      description={en ? "For your security, your session has ended. Sign in to continue." : "Pour votre sécurité, votre session a été fermée. Reconnectez-vous pour continuer."}
      actions={onSignIn ? <Button onClick={onSignIn}>{en ? "Sign in again" : "Se reconnecter"}</Button> : undefined}
    />
  );
}
