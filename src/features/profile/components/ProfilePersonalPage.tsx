import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSection } from "@/components/ui/page-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { useProfileOverview, useSaveProfile } from "@/features/profile/hooks/useProfile";
import { profileStepSchema } from "@/features/onboarding/schemas/onboarding.schemas";

type PersonalForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  occupation: string;
  phone: string;
};

const FIELD_CLASS = "grid min-w-0 gap-2";

export function ProfilePersonalPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const query = useProfileOverview();
  const saveProfile = useSaveProfile();
  const [form, setForm] = useState<PersonalForm>({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    countryOfResidence: "",
    occupation: "",
    phone: "",
  });

  useEffect(() => {
    if (!query.data) return;
    setForm({
      firstName: query.data.firstName,
      middleName: query.data.middleName,
      lastName: query.data.lastName,
      dateOfBirth: query.data.dateOfBirth,
      nationality: query.data.nationality,
      countryOfResidence: query.data.countryOfResidence,
      occupation: query.data.occupation,
      phone: query.data.phone,
    });
  }, [query.data]);

  if (query.isPending) {
    return <LoadingState label={en ? "Loading personal information…" : "Chargement des informations personnelles…"} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  const data = query.data;
  const locked = data.identityLocked;

  function updateField(key: keyof PersonalForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = profileStepSchema.safeParse(form);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? (en ? "Check the entered information." : "Vérifiez les informations saisies."));
      return;
    }

    try {
      const result = await saveProfile.mutateAsync(validation.data);
      toast.success(
        result.identityLocked
          ? en
            ? "Contact details saved. Verified identity details remain protected."
            : "Coordonnées enregistrées. Les données d’identité vérifiées restent protégées."
          : en
            ? "Personal information saved."
            : "Informations personnelles enregistrées.",
      );
    } catch {
      toast.error(
        en
          ? "Information could not be saved. Check the fields and try again."
          : "Les informations n’ont pas été enregistrées. Vérifiez les champs et réessayez.",
      );
    }
  }

  function field(
    key: keyof PersonalForm,
    label: string,
    type = "text",
    disabled = false,
  ) {
    return (
      <div className={FIELD_CLASS}>
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          type={type}
          value={form[key]}
          disabled={disabled}
          onChange={(event) => updateField(key, event.target.value)}
          autoComplete={
            key === "firstName" ? "given-name" :
            key === "middleName" ? "additional-name" :
            key === "lastName" ? "family-name" :
            key === "dateOfBirth" ? "bday" :
            key === "phone" ? "tel" : "off"
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader
        title={en ? "Personal information" : "Informations personnelles"}
        description={
          en
            ? "Keep your customer record accurate. Changes to verified identity details require review."
            : "Maintenez votre dossier client à jour. Les modifications des données d’identité vérifiées nécessitent un contrôle."
        }
      />

      <PageSection className="space-y-4">
        <Button asChild variant="ghost" className="w-fit px-0">
          <Link to="/app/profile">
            <ArrowLeft aria-hidden className="mr-2 size-4" />
            {en ? "Back to profile" : "Retour au profil"}
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{en ? "Identity details" : "État civil"}</CardTitle>
            <CardDescription>
              {en
                ? "Your legal name, date of birth and nationality."
                : "Votre nom légal, votre date de naissance et votre nationalité."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              {field("firstName", en ? "First name" : "Prénom", "text", locked)}
              {field("middleName", en ? "Middle names" : "Autres prénoms", "text", locked)}
              {field("lastName", en ? "Last name" : "Nom", "text", locked)}
              {field("dateOfBirth", en ? "Date of birth" : "Date de naissance", "date", locked)}
              {field("nationality", en ? "Nationality" : "Nationalité", "text", locked)}
              {field("countryOfResidence", en ? "Country of residence" : "Pays de résidence")}
              {field("occupation", en ? "Occupation" : "Profession")}
              {field("phone", en ? "International phone number" : "Téléphone international", "tel")}

              <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:col-span-2">
                {locked ? (
                  <p className="flex items-start gap-2 text-xs text-muted-foreground">
                    <LockKeyhole aria-hidden className="mt-0.5 size-4 shrink-0" />
                    {en
                      ? "Legal identity fields are locked while your identity verification is submitted, under review or verified. Contact support if a correction is required."
                      : "Les champs d’état civil sont verrouillés lorsque votre identité est soumise, en cours de vérification ou vérifiée. Contactez l’assistance pour demander une correction."}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck aria-hidden className="size-4" />
                    {data.phoneVerified
                      ? en
                        ? "Phone currently verified"
                        : "Téléphone actuellement vérifié"
                      : en
                        ? "Phone not verified"
                        : "Téléphone non vérifié"}
                    <StatusBadge
                      label={data.phoneVerified ? (en ? "Verified" : "Vérifié") : (en ? "To verify" : "À vérifier")}
                      tone={data.phoneVerified ? "success" : "pending"}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={saveProfile.isPending}
                    loading={saveProfile.isPending}
                    loadingLabel={en ? "Saving…" : "Enregistrement…"}
                  >
                    {en ? "Save information" : "Enregistrer"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageSection>
    </div>
  );
}
