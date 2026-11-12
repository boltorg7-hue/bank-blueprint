import { useEffect, useState } from "react";
import { MapPin, ShieldCheck, UserRound, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { ErrorState, LoadingState } from "@/components/feedback";
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

type Form = Record<string, string>;

const ADDRESS_FIELDS = [
  ["country", "Pays", "Country"],
  ["addressLine1", "Adresse", "Address"],
  ["addressLine2", "Complément d’adresse", "Address line 2"],
  ["city", "Ville", "City"],
  ["region", "Région", "Region"],
  ["postalCode", "Code postal", "Postal code"],
] as const;

export function ProfilePage() {
  const { language } = useLanguage();
  const en = language === "en";
  const query = useProfileOverview();
  const saveProfile = useSaveProfile();
  const saveAddress = useSaveAddress();
  const [profile, setProfile] = useState<Form>({});
  const [address, setAddress] = useState<Form>({});

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
  const field = (
    key: string,
    label: string,
    type = "text",
    locked = false,
  ) => (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={type}
        value={profile[key] ?? ""}
        disabled={locked}
        onChange={(event) =>
          setProfile((current) => ({ ...current, [key]: event.target.value }))
        }
      />
    </div>
  );

  async function submitProfile(event: React.FormEvent) {
    event.preventDefault();
    try {
      await saveProfile.mutateAsync(profile);
      toast.success(
        en
          ? "Personal information saved."
          : "Informations personnelles enregistrées.",
      );
    } catch {
      toast.error(
        en
          ? "Your information could not be saved."
          : "Les informations n’ont pas pu être enregistrées.",
      );
    }
  }

  async function submitAddress(event: React.FormEvent) {
    event.preventDefault();
    try {
      await saveAddress.mutateAsync(address);
      toast.success(en ? "Address saved." : "Adresse enregistrée.");
    } catch {
      toast.error(en ? "Your address could not be saved." : "L’adresse n’a pas pu être enregistrée.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <PageHeader
        title={en ? "My profile" : "Mon profil"}
        description={
          en
            ? "Manage your personal details, contact information and bank identity."
            : "Gérez vos informations personnelles, vos coordonnées et votre identité bancaire."
        }
        status={
          <StatusBadge
            label={LIFECYCLE_LABELS[data.lifecycleState]}
            tone={data.lifecycleState === "ACTIVE" ? "success" : "pending"}
          />
        }
      />

      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
          <ProfileSummary
            icon="identity"
            label={en ? "Identity verification" : "Vérification d’identité"}
            value={data.identityStatus}
            verified={data.identityStatus === "VERIFIED"}
          />
          <ProfileSummary
            icon="email"
            label={en ? "Email address" : "Adresse e-mail"}
            value={data.email ?? (en ? "Not provided" : "Non renseignée")}
            verified={data.emailVerified}
          />
          <ProfileSummary
            icon="phone"
            label={en ? "Phone number" : "Numéro de téléphone"}
            value={data.phone || (en ? "Not provided" : "Non renseigné")}
            verified={data.phoneVerified}
          />
        </CardContent>
      </Card>

      <PageSection className="space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>
                  {en ? "Identity and contact details" : "Identité et coordonnées"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {data.identityLocked
                    ? en
                      ? "Verified identity details are locked. Contact customer support if a correction is needed."
                      : "Les informations d’identité vérifiées sont verrouillées. Contactez le service client si une correction est nécessaire."
                    : en
                      ? "Keep these details consistent with your identity documents."
                      : "Veillez à ce que ces informations correspondent à vos documents d’identité."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitProfile} className="grid gap-4 sm:grid-cols-2">
              {field("firstName", en ? "First name" : "Prénom", "text", data.identityLocked)}
              {field("middleName", en ? "Middle names" : "Autres prénoms", "text", data.identityLocked)}
              {field("lastName", en ? "Last name" : "Nom", "text", data.identityLocked)}
              {field("dateOfBirth", en ? "Date of birth" : "Date de naissance", "date", data.identityLocked)}
              {field("nationality", en ? "Nationality" : "Nationalité", "text", data.identityLocked)}
              {field("countryOfResidence", en ? "Country of residence" : "Pays de résidence")}
              {field("occupation", en ? "Occupation" : "Profession")}
              {field("phone", en ? "Phone number" : "Téléphone", "tel")}

              <div className="grid min-w-0 gap-2">
                <Label htmlFor="profile-email">{en ? "Email address" : "Adresse e-mail"}</Label>
                <Input id="profile-email" value={data.email ?? ""} disabled />
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={data.emailVerified ? (en ? "Verified" : "Vérifiée") : (en ? "Not verified" : "Non vérifiée")}
                    tone={data.emailVerified ? "success" : "pending"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {en
                      ? "Your email is managed through account security."
                      : "Votre adresse e-mail est gérée depuis la sécurité du compte."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
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
                  className="w-full sm:w-auto"
                  disabled={saveProfile.isPending}
                  loading={saveProfile.isPending}
                  loadingLabel={en ? "Saving…" : "Enregistrement…"}
                >
                  {en ? "Save personal details" : "Enregistrer les informations"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>{en ? "Primary address" : "Adresse principale"}</CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "The address associated with your customer record."
                    : "L’adresse associée à votre dossier client."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitAddress} className="grid gap-4 sm:grid-cols-2">
              {ADDRESS_FIELDS.map(([key, label, labelEn]) => (
                <div className="grid min-w-0 gap-2" key={key}>
                  <Label htmlFor={`profile-address-${key}`}>
                    {en ? labelEn : label}
                  </Label>
                  <Input
                    id={`profile-address-${key}`}
                    value={address[key] ?? ""}
                    onChange={(event) =>
                      setAddress((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              <div className="flex justify-end border-t border-border/70 pt-4 sm:col-span-2">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={saveAddress.isPending}
                  loading={saveAddress.isPending}
                  loadingLabel={en ? "Saving…" : "Enregistrement…"}
                >
                  {en ? "Save address" : "Enregistrer l’adresse"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>{en ? "Identity verification" : "Vérification d’identité"}</CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Your identity verification status is separate from your bank account status."
                    : "Le statut de vérification de votre identité est distinct du statut de votre compte bancaire."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {en ? "Current verification status" : "Statut actuel de vérification"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {en
                  ? "Any additional document request will appear in your customer dashboard."
                  : "Toute demande de document complémentaire apparaîtra dans votre tableau de bord client."}
              </p>
            </div>
            <StatusBadge
              label={data.identityStatus}
              tone={data.identityStatus === "VERIFIED" ? "success" : "pending"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <WalletCards aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>{en ? "My bank details" : "Mes coordonnées bancaires"}</CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Read-only account references. Your balances and transactions are available in Accounts."
                    : "Références de compte en lecture seule. Vos soldes et opérations sont disponibles dans la rubrique Comptes."}
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
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {account.reference} · {account.maskedNumber}
                      </p>
                    </div>
                    <StatusBadge
                      label={account.status}
                      tone={account.status === "ACTIVE" ? "success" : "pending"}
                    />
                  </div>
                  {(account.iban || account.bic) ? (
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
                {en ? "No bank account opened yet." : "Aucun compte bancaire ouvert pour le moment."}
              </p>
            )}
          </CardContent>
        </Card>
      </PageSection>
    </div>
  );
}

function ProfileSummary({
  icon,
  label,
  value,
  verified,
}: {
  icon: "identity" | "email" | "phone";
  label: string;
  value: string;
  verified: boolean;
}) {
  const Icon = icon === "identity" ? ShieldCheck : icon === "email" ? UserRound : MapPin;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
        <StatusBadge
          label={verified ? "Verified" : "To verify"}
          tone={verified ? "success" : "pending"}
        />
      </div>
    </div>
  );
}
