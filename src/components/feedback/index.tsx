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
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/** Skeleton placeholder for content whose shape is known. */
export function SkeletonBlock({ lines = 3, className }: { lines?: number | undefined; className?: string | undefined }) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden="true">
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
  return (
    <StateBlock
      icon={AlertTriangle}
      tone="danger"
      title={title}
      description={description}
      actions={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Réessayer
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
  return (
    <StateBlock
      icon={WifiOff}
      tone="warning"
      title="Connexion indisponible"
      description="Vos informations bancaires nécessitent une connexion active. Aucune opération n'est enregistrée hors ligne."
      actions={
        onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Réessayer
          </Button>
        ) : undefined
      }
    />
  );
}

export function PermissionDeniedState({ description }: { description?: string | undefined }) {
  return (
    <StateBlock
      icon={ShieldOff}
      tone="warning"
      title="Accès non autorisé"
      description={
        description ??
        "Vous n'avez pas les autorisations nécessaires pour consulter cette section."
      }
    />
  );
}

export function SessionExpiredState({ onSignIn }: { onSignIn?: (() => void) | undefined }) {
  return (
    <StateBlock
      icon={Clock}
      tone="info"
      title="Votre session a expiré"
      description="Pour votre sécurité, votre session a été fermée. Reconnectez-vous pour continuer."
      actions={onSignIn ? <Button onClick={onSignIn}>Se reconnecter</Button> : undefined}
    />
  );
}
