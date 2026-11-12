import { useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, Camera, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSection } from "@/components/ui/page-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { useProfileOverview, useSaveProfileAvatar } from "@/features/profile/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProfileIdentityPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const query = useProfileOverview();
  const saveAvatar = useSaveProfileAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (query.isPending) {
    return <LoadingState label={en ? "Loading identity…" : "Chargement de l’identité…"} />;
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

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type) || file.size < 1 || file.size > MAX_AVATAR_BYTES) {
      toast.error(
        en
          ? "Choose a JPG, PNG or WebP image up to 3 MB."
          : "Choisissez une image JPG, PNG ou WebP de 3 Mo maximum.",
      );
      return;
    }

    setUploading(true);
    let uploadedPath: string | null = null;
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("AUTH_REQUIRED");

      const extension =
        file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
      uploadedPath = `${authData.user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("customer-avatars")
        .upload(uploadedPath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      try {
        await saveAvatar.mutateAsync(uploadedPath);
      } catch (error) {
        await supabase.storage.from("customer-avatars").remove([uploadedPath]);
        throw error;
      }

      toast.success(en ? "Profile photo updated." : "Photo de profil mise à jour.");
    } catch {
      toast.error(
        en
          ? "The photo could not be saved. Please try again."
          : "La photo n’a pas pu être enregistrée. Réessayez.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <PageHeader
        title={en ? "Identity and profile photo" : "Identité et photo de profil"}
        description={
          en
            ? "Manage the identity displayed in your secure banking area."
            : "Gérez l’identité affichée dans votre espace bancaire sécurisé."
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
            <CardTitle>{en ? "Profile photo" : "Photo de profil"}</CardTitle>
            <CardDescription>
              {en
                ? "Use a clear image. Your photo is private and is not a substitute for identity documents."
                : "Utilisez une image nette. Votre photo reste privée et ne remplace pas vos justificatifs d’identité."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-primary/10 text-2xl font-semibold text-primary shadow-sm">
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt={en ? "Your profile photo" : "Votre photo de profil"}
                  className="size-full object-cover"
                />
              ) : (
                initials || <UserRound aria-hidden className="size-10" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{fullName || (en ? "Name not provided" : "Nom non renseigné")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {en ? "JPG, PNG or WebP · 3 MB maximum" : "JPG, PNG ou WebP · 3 Mo maximum"}
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={uploadAvatar}
                aria-label={en ? "Choose a profile photo" : "Choisir une photo de profil"}
              />
              <Button
                type="button"
                className="mt-3 w-full sm:w-auto"
                disabled={uploading || saveAvatar.isPending}
                onClick={() => inputRef.current?.click()}
              >
                <Camera aria-hidden className="mr-2 size-4" />
                {uploading || saveAvatar.isPending
                  ? en
                    ? "Saving…"
                    : "Enregistrement…"
                  : en
                    ? "Choose a photo"
                    : "Choisir une photo"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{en ? "Identity status" : "État de l’identité"}</CardTitle>
            <CardDescription>
              {en
                ? "These statuses come from your verified account records."
                : "Ces statuts proviennent des informations officielles de votre compte."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <IdentityRow
              label={en ? "Identity verification" : "Vérification d’identité"}
              value={data.identityStatus}
              verified={data.identityStatus === "VERIFIED"}
            />
            <IdentityRow
              label={en ? "Email address" : "Adresse e-mail"}
              value={data.emailVerified ? (en ? "Verified" : "Vérifiée") : en ? "To verify" : "À vérifier"}
              verified={data.emailVerified}
            />
            <IdentityRow
              label={en ? "Phone number" : "Numéro de téléphone"}
              value={data.phoneVerified ? (en ? "Verified" : "Vérifié") : en ? "To verify" : "À vérifier"}
              verified={data.phoneVerified}
            />
            <p className="flex items-start gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
              {en
                ? "Changing your profile photo does not change your KYC or identity verification status."
                : "Changer votre photo ne modifie pas votre statut KYC ni votre vérification d’identité."}
            </p>
          </CardContent>
        </Card>
      </PageSection>
    </div>
  );
}

function IdentityRow({
  label,
  value,
  verified,
}: {
  label: string;
  value: string;
  verified: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/20 p-3">
      <span className="text-sm font-medium">{label}</span>
      <StatusBadge label={value} tone={verified ? "success" : "pending"} />
    </div>
  );
}
