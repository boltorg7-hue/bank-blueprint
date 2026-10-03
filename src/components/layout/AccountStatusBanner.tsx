import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, type LucideIcon } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import type { CustomerLifecycleState } from "@/types/customer-lifecycle";
import { LIFECYCLE_LABELS, LIFECYCLE_LABELS_EN } from "@/types/customer-lifecycle";

type BannerConfig = {
  icon: LucideIcon;
  tone: string;
  message: string;
  messageEn: string;
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
    messageEn: "Confirm your email address to continue.",
  },
  CONTACT_VERIFICATION_REQUIRED: {
    icon: AlertTriangle,
    tone: "bg-warning-muted/50 text-foreground",
    message: "Vérifiez votre numéro de téléphone pour sécuriser votre compte.",
    messageEn: "Verify your phone number to secure your account.",
  },
  PROFILE_INCOMPLETE: {
    icon: AlertTriangle,
    tone: "bg-warning-muted/50 text-foreground",
    message: "Complétez vos informations personnelles pour finaliser l'ouverture.",
    messageEn: "Complete your personal information to finish opening your account.",
  },
  IDENTITY_REQUIRED: {
    icon: AlertTriangle,
    tone: "bg-warning-muted/50 text-foreground",
    message: "Une vérification d'identité est nécessaire avant d'activer votre compte.",
    messageEn: "Identity verification is required before your account can be activated.",
  },
  IDENTITY_UNDER_REVIEW: {
    icon: Clock,
    tone: "bg-info-muted/50 text-foreground",
    message: "Votre dossier est en cours de vérification. Nous vous informerons dès la validation.",
    messageEn: "Your application is being reviewed. We will notify you when it is validated.",
  },
  BANKING_REVIEW: {
    icon: Clock,
    tone: "bg-info-muted/50 text-foreground",
    message: "Votre demande d'ouverture de compte est en cours d'examen.",
    messageEn: "Your account opening request is under review.",
  },
  RESTRICTED: {
    icon: ShieldAlert,
    tone: "bg-danger-muted/50 text-foreground",
    message: "Certaines opérations sont temporairement limitées sur votre compte.",
    messageEn: "Some banking operations are temporarily limited on your account.",
  },
  SUSPENDED: {
    icon: ShieldAlert,
    tone: "bg-danger-muted/50 text-foreground",
    message: "Votre compte est suspendu. Contactez le service client.",
    messageEn: "Your account is suspended. Contact customer support.",
  },
  IDENTITY_VERIFIED: {
    icon: CheckCircle2,
    tone: "bg-success-muted/50 text-foreground",
    message: "Votre identité est vérifiée.",
    messageEn: "Your identity has been verified.",
  },
};

export function AccountStatusBanner({ state }: { state: CustomerLifecycleState }) {
  const { language } = useLanguage();
  const en = language === "en";
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
        <p className="font-medium">{en ? LIFECYCLE_LABELS_EN[state] : LIFECYCLE_LABELS[state]}</p>
        <p className="leading-relaxed text-muted-foreground">{en ? config.messageEn : config.message}</p>
      </div>
    </div>
  );
}
