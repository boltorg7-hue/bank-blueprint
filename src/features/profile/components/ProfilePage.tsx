import {
  ArrowUpRight,
  CircleHelp,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Settings2,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSection } from "@/components/ui/page-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { useProfileOverview } from "@/features/profile/hooks/useProfile";
import { LIFECYCLE_LABELS } from "@/types/customer-lifecycle";

const SECTION_ICON_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary";
const SHORTCUT_CLASS =
  "group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:border-primary/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ProfilePage() {
  const { language } = useLanguage();
  const en = language === "en";
  const query = useProfileOverview();

  if (query.isPending) {
    return <LoadingState label={en ? "Loading your profile…" : "Chargement de votre profil…"} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  const data = query.data;
  const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ");
  const initials = [data.firstName, data.lastName]
    .filter(Boolean)
    .map((part) => part.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <PageHeader
        title={en ? "My profile" : "Mon profil"}
        description={
          en
            ? "Your personal identity, banking profile and account settings in one place."
            : "Retrouvez votre identité, votre profil bancaire et les paramètres de votre espace."
        }
        status={
          <StatusBadge
            label={LIFECYCLE_LABELS[data.lifecycleState]}
            tone={data.lifecycleState === "ACTIVE" ? "success" : "pending"}
          />
        }
      />

      <PageSection className="space-y-5">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.09] via-card to-card">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-6">
            <div className="flex size-20 shrink-0 items-center justify-center self-start overflow-hidden rounded-full border-4 border-background bg-primary/10 text-xl font-semibold text-primary shadow-sm sm:size-24">
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt={en ? "Profile photo" : "Photo de profil"}
                  className="size-full object-cover"
                />
              ) : (
                initials || <UserRound aria-hidden className="size-9" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {en ? "Customer identity" : "Identité client"}
              </p>
              <h2 className="mt-1 break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {fullName || (en ? "Name not provided" : "Nom non renseigné")}
              </h2>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {data.email ?? (en ? "No email address" : "Aucune adresse e-mail")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={LIFECYCLE_LABELS[data.lifecycleState]}
                  tone={data.lifecycleState === "ACTIVE" ? "success" : "pending"}
                />
                <StatusBadge
                  label={
                    data.identityStatus === "VERIFIED"
                      ? en
                        ? "Identity verified"
                        : "Identité vérifiée"
                      : en
                        ? "Identity to verify"
                        : "Identité à vérifier"
                  }
                  tone={data.identityStatus === "VERIFIED" ? "success" : "pending"}
                />
              </div>
              <Button asChild size="sm" variant="outline" className="mt-3 w-fit">
                <Link to="/app/profile/identity">
                  {en ? "Manage identity and photo" : "Gérer l’identité et la photo"}
                  <ArrowUpRight aria-hidden className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid w-full gap-2 sm:w-auto sm:min-w-44">
              <ProfileSummary
                icon="email"
                en={en}
                label={en ? "Email" : "E-mail"}
                value={data.email ?? "—"}
                verified={data.emailVerified}
              />
              <ProfileSummary
                icon="phone"
                en={en}
                label={en ? "Phone" : "Téléphone"}
                value={data.phone || "—"}
                verified={data.phoneVerified}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className={SECTION_ICON_CLASS}>
                <UserRound aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>
                  {en ? "Personal information" : "Informations personnelles"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Manage your legal identity, contact details and primary address."
                    : "Gérez votre état civil, vos coordonnées et votre adresse principale."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link to="/app/profile/personal" className={SHORTCUT_CLASS}>
              <span className="flex min-w-0 items-center gap-3">
                <UserRound aria-hidden className="size-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {en ? "Personal details" : "Informations personnelles"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {en
                      ? "Name, date of birth, nationality and phone"
                      : "Nom, date de naissance, nationalité et téléphone"}
                  </span>
                </span>
              </span>
              <ArrowUpRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </Link>
            <Link to="/app/profile/address" className={SHORTCUT_CLASS}>
              <span className="flex min-w-0 items-center gap-3">
                <MapPin aria-hidden className="size-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {en ? "Primary address" : "Adresse principale"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {data.address.city ||
                      data.address.country ||
                      (en ? "Not provided" : "Non renseignée")}
                  </span>
                </span>
              </span>
              <ArrowUpRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className={SECTION_ICON_CLASS}>
                <WalletCards aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>{en ? "Banking profile" : "Profil bancaire"}</CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Your linked accounts and secure account references. Balances and transactions remain in Accounts."
                    : "Vos comptes associés et leurs références sécurisées. Les soldes et opérations restent dans la rubrique Comptes."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {data.accounts.length ? (
              data.accounts.map((account) => (
                <div
                  key={account.reference}
                  className="rounded-xl border border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{account.displayName}</p>
                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                        {account.reference} · {account.maskedNumber}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {en ? "Currency" : "Devise"} : {account.currency}
                      </p>
                    </div>
                    <StatusBadge
                      label={account.status}
                      tone={account.status === "ACTIVE" ? "success" : "pending"}
                    />
                  </div>

                  {account.iban || account.bic ? (
                    <div className="mt-3 grid gap-2 border-t border-border/70 pt-3 sm:grid-cols-2">
                      {account.iban ? (
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">IBAN</p>
                          <p className="break-all font-mono text-xs text-foreground">
                            {account.iban}
                          </p>
                        </div>
                      ) : null}
                      {account.bic ? (
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">BIC</p>
                          <p className="break-all font-mono text-xs text-foreground">
                            {account.bic}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                {en
                  ? "No bank account opened yet."
                  : "Aucun compte bancaire ouvert pour le moment."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className={SECTION_ICON_CLASS}>
                <LockKeyhole aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>
                  {en ? "Security and verification" : "Sécurité et vérifications"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Review verification progress and manage your password and active sessions."
                    : "Consultez vos vérifications et gérez votre mot de passe ainsi que vos sessions actives."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <VerificationItem
                label={en ? "Email" : "E-mail"}
                verified={data.emailVerified}
                en={en}
              />
              <VerificationItem
                label={en ? "Phone" : "Téléphone"}
                verified={data.phoneVerified}
                en={en}
              />
              <VerificationItem
                label={en ? "Identity" : "Identité"}
                verified={data.identityStatus === "VERIFIED"}
                en={en}
              />
            </div>
            <Link to="/app/security" className={SHORTCUT_CLASS}>
              <span className="flex min-w-0 items-center gap-3">
                <LockKeyhole aria-hidden className="size-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {en ? "Open security center" : "Ouvrir le centre de sécurité"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {en ? "Password, devices and sessions" : "Mot de passe, appareils et sessions"}
                  </span>
                </span>
              </span>
              <ArrowUpRight
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className={SECTION_ICON_CLASS}>
                <Settings2 aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>
                  {en ? "Application and preferences" : "Application et préférences"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Customize language, appearance, privacy and notification channels."
                    : "Personnalisez la langue, l’affichage, la confidentialité et les notifications."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Link to="/app/settings" className={SHORTCUT_CLASS}>
              <span className="flex min-w-0 items-center gap-3">
                <Settings2 aria-hidden className="size-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {en ? "Manage my preferences" : "Gérer mes préférences"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {en
                      ? "Language, theme, privacy and alerts"
                      : "Langue, thème, confidentialité et alertes"}
                  </span>
                </span>
              </span>
              <ArrowUpRight
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className={SECTION_ICON_CLASS}>
                <MessageCircle aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>
                  {en ? "Support and account assistance" : "Assistance et gestion du compte"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Contact the bank securely or find answers in the help center."
                    : "Contactez la banque de manière sécurisée ou consultez le centre d’aide."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link to="/app/messages" className={SHORTCUT_CLASS}>
              <span className="flex min-w-0 items-center gap-3">
                <MessageCircle aria-hidden className="size-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {en ? "Secure messages" : "Messagerie sécurisée"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {en ? "Talk to customer support" : "Échanger avec le service client"}
                  </span>
                </span>
              </span>
              <ArrowUpRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </Link>
            <Link to="/help" className={SHORTCUT_CLASS}>
              <span className="flex min-w-0 items-center gap-3">
                <CircleHelp aria-hidden className="size-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {en ? "Help center" : "Centre d’aide"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {en ? "Guides and common questions" : "Guides et questions fréquentes"}
                  </span>
                </span>
              </span>
              <ArrowUpRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </PageSection>
    </div>
  );
}

function VerificationItem({
  label,
  verified,
  en,
}: {
  label: string;
  verified: boolean;
  en: boolean;
}) {
  const statusLabel = verified ? (en ? "Verified" : "Vérifié") : en ? "To verify" : "À vérifier";

  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <ShieldCheck aria-hidden className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <div className="mt-2">
        <StatusBadge label={statusLabel} tone={verified ? "success" : "pending"} />
      </div>
    </div>
  );
}

function ProfileSummary({
  icon,
  en,
  label,
  value,
  verified,
}: {
  icon: "email" | "phone";
  en: boolean;
  label: string;
  value: string;
  verified: boolean;
}) {
  const Icon = icon === "email" ? Mail : Phone;
  const statusLabel = verified ? (en ? "Verified" : "Vérifiée") : en ? "To verify" : "À vérifier";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
        <StatusBadge label={statusLabel} tone={verified ? "success" : "pending"} />
      </div>
    </div>
  );
}
