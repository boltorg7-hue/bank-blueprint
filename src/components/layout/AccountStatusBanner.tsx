import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CustomerLifecycleState } from "@/types/customer-lifecycle";
import { LIFECYCLE_LABELS } from "@/types/customer-lifecycle";

type BannerConfig = {
  icon: LucideIcon;
  tone: string;
  message: string;
};

/**
 * Account-status communication. Rendered only when the customer genuinely
 * needs to act — status always combines an icon with text, never color alone.
 */
const CONFIG: Partial<Record<CustomerLifecycleState, BannerConfig>> = {
  EMAIL_VERIFICATION_REQUIRED: {
    icon: AlertTriangle,
    tone: "bg-warning-muted/50 text-foreground",
    message: "Confirmez votre adresse e-mail pour continuer.",
  },
  CONTACT_VERIFICATION_REQUIRED: {
    icon: AlertTriangle,
    tone: "bg-warning-muted/50 text-foreground",
    message: "Vérifiez votre numéro de téléphone pour sécuriser votre compte.",
  },
  PROFILE_INCOMPLETE: {
    icon: AlertTriangle,
    tone: "bg-warning-muted/50 text-foreground",
    message: "Complétez vos informations personnelles pour finaliser l'ouverture.",
  },
  IDENTITY_REQUIRED: {
    icon: AlertTriangle,
    tone: "bg-warning-muted/50 text-foreground",
    message: "Une vérification d'identité est nécessaire avant d'activer votre compte.",
  },
  IDENTITY_UNDER_REVIEW: {
    icon: Clock,
    tone: "bg-info-muted/50 text-foreground",
    message: "Votre dossier est en cours de vérification. Nous vous informerons dès la validation.",
  },
  BANKING_REVIEW: {
    icon: Clock,
    tone: "bg-info-muted/50 text-foreground",
    message: "Votre demande d'ouverture de compte est en cours d'examen.",
  },
  RESTRICTED: {
    icon: ShieldAlert,
    tone: "bg-danger-muted/50 text-foreground",
    message: "Certaines opérations sont temporairement limitées sur votre compte.",
  },
  SUSPENDED: {
    icon: ShieldAlert,
    tone: "bg-danger-muted/50 text-foreground",
    message: "Votre compte est suspendu. Contactez le service client.",
  },
  IDENTITY_VERIFIED: {
    icon: CheckCircle2,
    tone: "bg-success-muted/50 text-foreground",
    message: "Votre identité est vérifiée.",
  },
};

export function AccountStatusBanner({ state }: { state: CustomerLifecycleState }) {
  const config = CONFIG[state];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      role="status"
      className={cn(
        "mb-5 flex items-start gap-3 rounded-xl border border-border px-4 py-3",
        config.tone,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-0.5 text-sm">
        <p className="font-medium">{LIFECYCLE_LABELS[state]}</p>
        <p className="leading-relaxed text-muted-foreground">{config.message}</p>
      </div>
    </div>
  );
}
