import {
  ArrowUpRight,
  CircleHelp,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Settings2,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ErrorState, LoadingState } from "@/components/feedback";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSection } from "@/components/ui/page-section";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useProfileOverview,
  useSaveAddress,
  useSaveProfile,
} from "@/features/profile/hooks/useProfile";
import { LIFECYCLE_LABELS } from "@/types/customer-lifecycle";

type FormValues = Record<string, string>;

const SECTION_ICON_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary";
const SHORTCUT_CLASS =
  "group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:border-primary/30 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ProfilePage() {
  const { language } = useLanguage();
  const en = language === "en";
  const query = useProfileOverview();
  const saveProfile = useSaveProfile();
  const saveAddress = useSaveAddress();
  const [profile, setProfile] = useState<FormValues>({});
  const [address, setAddress] = useState<FormValues>({});

  useEffect(() => {
    if (!query.data) return;

    const data = query.data;
    setProfile({
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      countryOfResidence: data.countryOfResidence,
      occupation: data.occupation,
      phone: data.phone,
    });
    setAddress(data.address);
  }, [query.data]);

  if (query.isPending) {
    return (
      <LoadingState
        label={en ? "Loading your profile…" : "Chargement de votre profil…"}
      />
    );
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  const data = query.data;
  const fullName = [data.firstName, data.middleName, data.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = [data.firstName, data.lastName]
    .filter(Boolean)
    .map((part) => part.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function updateProfileField(key: string, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateAddressField(key: string, value: string) {
    setAddress((current) => ({ ...current, [key]: value }));
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await saveProfile.mutateAsync(profile);
      toast.success(
        en
          ? "Personal information saved."
          : "Vos informations personnelles ont été enregistrées.",
      );
    } catch {
      toast.error(
        en
          ? "Your information could not be saved. Please review it and try again."
          : "Vos informations n’ont pas pu être enregistrées. Vérifiez-les puis réessayez.",
      );
    }
  }

  async function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await saveAddress.mutateAsync(address);
      toast.success(en ? "Address saved." : "Votre adresse a été enregistrée.");
    } catch {
      toast.error(
        en
          ? "Your address could not be saved. Please try again."
          : "Votre adresse n’a pas pu être enregistrée. Veuillez réessayer.",
      );
    }
  }

  function profileField(
    key: string,
    label: string,
    options: {
      type?: string;
      locked?: boolean;
      required?: boolean;
      autoComplete?: string;
    } = {},
  ) {
    return (
      <div className="min-w-0 space-y-2">
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          type={options.type ?? "text"}
          value={profile[key] ?? ""}
          disabled={options.locked}
          required={options.required ?? true}
          autoComplete={options.autoComplete}
          onChange={(event) => updateProfileField(key, event.target.value)}
        />
      </div>
    );
  }

  function addressField(
    key: string,
    label: string,
    options: { required?: boolean; autoComplete?: string } = {},
  ) {
    return (
      <div className="min-w-0 space-y-2">
        <Label htmlFor={`address-${key}`}>{label}</Label>
        <Input
          id={`address-${key}`}
          value={address[key] ?? ""}
          required={options.required ?? false}
          autoComplete={options.autoComplete}
          onChange={(event) => updateAddressField(key, event.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <PageHeader
        title={en ? "My profile" : "Mon profil"}
        description={
          en
            ? "Keep your personal details accurate and review the information linked to your customer record."
            : "Gardez vos informations à jour et consultez les éléments associés à votre dossier client."
        }
        status={
          <StatusBadge
            label={LIFECYCLE_LABELS[data.lifecycleState]}
            tone={data.lifecycleState === "ACTIVE" ? "success" : "pending"}
          />
        }
      />

      <PageSection className="space-y-5">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-6">
            <div className="flex size-16 shrink-0 items-center justify-center self-start overflow-hidden rounded-full border-4 border-background bg-primary/10 text-lg font-semibold text-primary shadow-sm sm:size-20">
              {initials || <UserRound aria-hidden className="size-8" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {en ? "Customer profile" : "Profil client"}
              </p>
              <h2 className="mt-1 break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {fullName || (en ? "Name not provided" : "Nom non renseigné")}
              </h2>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {data.email ?? (en ? "No email address" : "Aucune adresse e-mail")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge
                  label={
                    data.identityStatus === "VERIFIED"
                      ? en
                        ? "Identity verified"
                        : "Identité vérifiée"
                      : `${en ? "Identity status" : "Statut identité"} : ${data.identityStatus}`
                  }
                  tone={data.identityStatus === "VERIFIED" ? "success" : "pending"}
                />
                <StatusBadge
                  label={
                    data.emailVerified
                      ? en
                        ? "Email verified"
                        : "E-mail vérifié"
                      : en
                        ? "Email not verified"
                        : "E-mail non vérifié"
                  }
                  tone={data.emailVerified ? "success" : "pending"}
                />
              </div>
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
                  {en
                    ? "Identity and personal details"
                    : "Identité et informations personnelles"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {data.identityLocked
                    ? en
                      ? "Your identity details are locked while verification is in progress or complete. Contact support if a correction is needed."
                      : "Vos données d’identité sont verrouillées pendant ou après leur vérification. Contactez l’assistance si une correction est nécessaire."
                    : en
                      ? "Enter details exactly as they appear on your identity documents."
                      : "Renseignez vos informations comme elles figurent sur vos pièces d’identité."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {profileField("firstName", en ? "First name" : "Prénom", {
                  locked: data.identityLocked,
                  autoComplete: "given-name",
                })}
                {profileField("middleName", en ? "Middle names" : "Autres prénoms", {
                  locked: data.identityLocked,
                  required: false,
                  autoComplete: "additional-name",
                })}
                {profileField("lastName", en ? "Last name" : "Nom", {
                  locked: data.identityLocked,
                  autoComplete: "family-name",
                })}
                {profileField("dateOfBirth", en ? "Date of birth" : "Date de naissance", {
                  type: "date",
                  locked: data.identityLocked,
                  autoComplete: "bday",
                })}
                {profileField("nationality", en ? "Nationality" : "Nationalité", {
                  locked: data.identityLocked,
                })}
                {profileField(
                  "countryOfResidence",
                  en ? "Country of residence" : "Pays de résidence",
                  { autoComplete: "country-name" },
                )}
                {profileField("occupation", en ? "Occupation" : "Profession")}
                {profileField(
                  "phone",
                  en ? "Phone number (+country code)" : "Téléphone (avec indicatif)",
                  { type: "tel", autoComplete: "tel" },
                )}
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="profile-email">
                    {en ? "Email address" : "Adresse e-mail"}
                  </Label>
                  <Input id="profile-email" value={data.email ?? ""} disabled />
                  <p className="text-xs text-muted-foreground">
                    {data.emailVerified
                      ? en
                        ? "This address has been verified."
                        : "Cette adresse a été vérifiée."
                      : en
                        ? "This address has not been verified."
                        : "Cette adresse n’a pas encore été vérifiée."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                {data.identityLocked ? (
                  <p className="text-xs text-muted-foreground">
                    {en
                      ? "Verified identity fields cannot be edited here."
                      : "Les champs d’identité vérifiés ne peuvent pas être modifiés ici."}
                  </p>
                ) : (
                  <span />
                )}
                <Button
                  type="submit"
                  className="min-h-11 w-full sm:w-auto"
                  disabled={saveProfile.isPending}
                >
                  {saveProfile.isPending
                    ? en
                      ? "Saving…"
                      : "Enregistrement…"
                    : en
                      ? "Save personal details"
                      : "Enregistrer les informations"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className={SECTION_ICON_CLASS}>
                <MapPin aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>{en ? "Primary address" : "Adresse principale"}</CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Keep the address associated with your customer record current."
                    : "Maintenez à jour l’adresse associée à votre dossier client."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitAddress} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {addressField("country", en ? "Country" : "Pays", {
                  required: true,
                  autoComplete: "country-name",
                })}
                {addressField("addressLine1", en ? "Address" : "Adresse", {
                  required: true,
                  autoComplete: "address-line1",
                })}
                {addressField(
                  "addressLine2",
                  en ? "Additional address details" : "Complément d’adresse",
                  { autoComplete: "address-line2" },
                )}
                {addressField("city", en ? "City" : "Ville", {
                  required: true,
                  autoComplete: "address-level2",
                })}
                {addressField("region", en ? "Region / state" : "Région / département", {
                  autoComplete: "address-level1",
                })}
                {addressField("postalCode", en ? "Postal code" : "Code postal", {
                  autoComplete: "postal-code",
                })}
              </div>
              <div className="flex justify-end border-t border-border/70 pt-4">
                <Button
                  type="submit"
                  className="min-h-11 w-full sm:w-auto"
                  disabled={saveAddress.isPending}
                >
                  {saveAddress.isPending
                    ? en
                      ? "Saving…"
                      : "Enregistrement…"
                    : en
                      ? "Save address"
                      : "Enregistrer l’adresse"}
                </Button>
              </div>
            </form>
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
                    ? "View your linked accounts and secure references. Balances and transactions remain in Accounts."
                    : "Consultez vos comptes associés et leurs références. Les soldes et opérations restent dans la rubrique Comptes."}
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
                  <Link
                    to="/app/accounts/$accountRef"
                    params={{ accountRef: account.reference }}
                    className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {en ? "View account details" : "Consulter les détails du compte"}
                    <ArrowUpRight aria-hidden className="size-4" />
                  </Link>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                {en
                  ? "No bank account is linked to your profile yet."
                  : "Aucun compte bancaire n’est encore associé à votre profil."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className={SECTION_ICON_CLASS}>
                <ShieldCheck aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>
                  {en ? "Security and verification" : "Sécurité et vérifications"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Review your contact and identity verification statuses separately from your banking lifecycle."
                    : "Consultez séparément les vérifications de vos coordonnées et de votre identité, indépendamment de l’état bancaire."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <VerificationStatus
                label={en ? "Email" : "E-mail"}
                verified={data.emailVerified}
                en={en}
              />
              <VerificationStatus
                label={en ? "Phone" : "Téléphone"}
                verified={data.phoneVerified}
                en={en}
              />
              <VerificationStatus
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
              <ArrowUpRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
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
                    ? "Customize your language, appearance, privacy and service notifications."
                    : "Personnalisez la langue, l’affichage, la confidentialité et les notifications de service."}
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
                    {en ? "Manage preferences" : "Gérer mes préférences"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {en
                      ? "Language, theme, privacy and alerts"
                      : "Langue, thème, confidentialité et alertes"}
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
                <MessageCircle aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>
                  {en ? "Support and account assistance" : "Assistance et gestion du compte"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Get help with your profile or contact the bank through a secure channel."
                    : "Obtenez de l’aide sur votre profil ou contactez la banque par un canal sécurisé."}
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
                    {en ? "Contact customer support" : "Contacter le service client"}
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

function VerificationStatus({
  label,
  verified,
  en,
}: {
  label: string;
  verified: boolean;
  en: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <ShieldCheck aria-hidden className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <StatusBadge
        className="mt-3"
        label={
          verified
            ? en
              ? "Verified"
              : "Vérifié"
            : en
              ? "To verify"
              : "À vérifier"
        }
        tone={verified ? "success" : "pending"}
      />
    </div>
  );
}
