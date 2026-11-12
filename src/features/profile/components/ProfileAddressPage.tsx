import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, MapPin, ShieldCheck } from "lucide-react";
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
import { useProfileOverview, useSaveAddress } from "@/features/profile/hooks/useProfile";
import { addressStepSchema } from "@/features/onboarding/schemas/onboarding.schemas";

type AddressForm = {
  country: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
};

const FIELDS: {
  key: keyof AddressForm;
  label: string;
  labelEn: string;
  required: boolean;
  autoComplete: string;
}[] = [
  {
    key: "country",
    label: "Pays",
    labelEn: "Country",
    required: true,
    autoComplete: "country-name",
  },
  {
    key: "addressLine1",
    label: "Adresse",
    labelEn: "Address line",
    required: true,
    autoComplete: "address-line1",
  },
  {
    key: "addressLine2",
    label: "Complément d’adresse",
    labelEn: "Address line 2",
    required: false,
    autoComplete: "address-line2",
  },
  {
    key: "city",
    label: "Ville",
    labelEn: "City",
    required: true,
    autoComplete: "address-level2",
  },
  {
    key: "region",
    label: "Région / État",
    labelEn: "Region / State",
    required: false,
    autoComplete: "address-level1",
  },
  {
    key: "postalCode",
    label: "Code postal",
    labelEn: "Postal code",
    required: false,
    autoComplete: "postal-code",
  },
];

export function ProfileAddressPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const query = useProfileOverview();
  const saveAddress = useSaveAddress();
  const [form, setForm] = useState<AddressForm>({
    country: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    postalCode: "",
  });

  useEffect(() => {
    if (!query.data) return;
    setForm(query.data.address);
  }, [query.data]);

  if (query.isPending) {
    return <LoadingState label={en ? "Loading address…" : "Chargement de l’adresse…"} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = addressStepSchema.safeParse(form);
    if (!validation.success) {
      toast.error(
        validation.error.issues[0]?.message ??
          (en ? "Check the address details." : "Vérifiez les informations de l’adresse."),
      );
      return;
    }

    try {
      await saveAddress.mutateAsync(validation.data);
      toast.success(en ? "Primary address saved." : "Adresse principale enregistrée.");
    } catch {
      toast.error(
        en
          ? "The address could not be saved. Please try again."
          : "L’adresse n’a pas pu être enregistrée. Réessayez.",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader
        title={en ? "Primary address" : "Adresse principale"}
        description={
          en
            ? "Maintain the residential address attached to your customer record."
            : "Maintenez à jour l’adresse de résidence associée à votre dossier client."
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
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>{en ? "Residential address" : "Adresse de résidence"}</CardTitle>
                <CardDescription>
                  {en
                    ? "Use your current residential address. Required fields are marked."
                    : "Indiquez votre adresse actuelle de résidence. Les champs obligatoires sont signalés."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div className="grid min-w-0 gap-2" key={field.key}>
                  <Label htmlFor={field.key}>
                    {en ? field.labelEn : field.label}
                    {field.required ? <span className="ml-1 text-destructive">*</span> : null}
                  </Label>
                  <Input
                    id={field.key}
                    value={form[field.key]}
                    autoComplete={field.autoComplete}
                    required={field.required}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {en
                    ? "Your address is stored in your secure customer record."
                    : "Votre adresse est enregistrée dans votre dossier client sécurisé."}
                </p>
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
      </PageSection>
    </div>
  );
}
