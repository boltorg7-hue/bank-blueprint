import { useLanguage } from "@/components/providers/LanguageProvider";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/ui/page-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { useProfileOverview, useSaveAddress, useSaveProfile } from "@/features/profile/hooks/useProfile";
import { LIFECYCLE_LABELS } from "@/types/customer-lifecycle";

type Form = Record<string, string>;
export function ProfilePage() {
  const { language } = useLanguage();
  const en = language === "en";
  const query = useProfileOverview(); const saveProfile = useSaveProfile(); const saveAddress = useSaveAddress();
  const [profile, setProfile] = useState<Form>({}); const [address, setAddress] = useState<Form>({});
  useEffect(() => { if (!query.data) return; const p = query.data; setProfile({ firstName:p.firstName,middleName:p.middleName,lastName:p.lastName,dateOfBirth:p.dateOfBirth,nationality:p.nationality,countryOfResidence:p.countryOfResidence,occupation:p.occupation,phone:p.phone }); setAddress(p.address); }, [query.data]);
  if (query.isPending) return <LoadingState label={en ? "Loading your profile…" : "Chargement de votre profil…"} />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const data = query.data; const field = (key: string, label: string, type = "text", locked = false) => <div className="space-y-2"><Label htmlFor={key}>{label}</Label><Input id={key} type={type} value={profile[key] ?? ""} disabled={locked} onChange={(e) => setProfile((v) => ({...v,[key]:e.target.value}))} /></div>;
  async function submitProfile(e: React.FormEvent) { e.preventDefault(); try { await saveProfile.mutateAsync(profile); toast.success((en ? "Personal information saved." : "Informations personnelles enregistrées.")); } catch { toast.error((en ? "Your information could not be saved." : "Les informations n’ont pas pu être enregistrées.")); } }
  async function submitAddress(e: React.FormEvent) { e.preventDefault(); try { await saveAddress.mutateAsync(address); toast.success((en ? "Address saved." : "Adresse enregistrée.")); } catch { toast.error((en ? "Your address could not be saved." : "L’adresse n’a pas pu être enregistrée.")); } }
  return <div className="mx-auto w-full max-w-4xl">
    <PageHeader title={en ? "My profile" : "Mon profil"} description={en ? "Your personal details, verification and bank information." : "Vos informations personnelles, votre vérification et vos coordonnées bancaires."} status={<StatusBadge label={LIFECYCLE_LABELS[data.lifecycleState]} tone={data.lifecycleState === "ACTIVE" ? "success" : "pending"} />} />
    <PageSection className="space-y-6">
      <Card><CardHeader><CardTitle>{en ? "Identity and contact details" : "Identité et coordonnées"}</CardTitle><CardDescription>{data.identityLocked ? (en ? "Verified identity details are locked. Contact customer support to correct them." : "Les informations d’identité vérifiées sont verrouillées. Contactez le service client pour les corriger.") : (en ? "These details must match your identity documents." : "Ces informations doivent correspondre à vos documents d’identité.")}</CardDescription></CardHeader><CardContent><form onSubmit={submitProfile} className="grid gap-4 sm:grid-cols-2">
        {field("firstName",(en ? "First name" : "Prénom"),"text",data.identityLocked)}{field("middleName",(en ? "Middle names" : "Autres prénoms"),"text",data.identityLocked)}{field("lastName",(en ? "Last name" : "Nom"),"text",data.identityLocked)}{field("dateOfBirth",(en ? "Date of birth" : "Date de naissance"),"date",data.identityLocked)}{field("nationality",(en ? "Nationality" : "Nationalité"),"text",data.identityLocked)}{field("countryOfResidence",(en ? "Country of residence" : "Pays de résidence"))}{field("occupation",(en ? "Occupation" : "Profession"))}{field("phone",(en ? "Phone" : "Téléphone"),"tel")}
        <div className="space-y-2"><Label>{en ? "Email" : "E-mail"}</Label><Input value={data.email ?? ""} disabled /><p className="text-xs text-muted-foreground">{data.emailVerified ? (en ? "Email verified" : "Adresse vérifiée") : (en ? "Email not verified" : "Adresse non vérifiée")}</p></div>
        <div className="sm:col-span-2"><Button disabled={saveProfile.isPending}>{saveProfile.isPending ? (en ? "Saving…" : "Enregistrement…") : (en ? "Save profile" : "Enregistrer le profil")}</Button></div>
      </form></CardContent></Card>
      <Card><CardHeader><CardTitle>{en ? "Primary address" : "Adresse principale"}</CardTitle><CardDescription>{en ? "Address used for your customer record." : "Adresse utilisée pour votre dossier client."}</CardDescription></CardHeader><CardContent><form onSubmit={submitAddress} className="grid gap-4 sm:grid-cols-2">
        {([["country",(en ? "Country" : "Pays")],["addressLine1",(en ? "Address" : "Adresse")],["addressLine2",(en ? "Address line 2" : "Complément")],["city",(en ? "City" : "Ville")],["region",(en ? "Region" : "Région")],["postalCode",(en ? "Postal code" : "Code postal")]] as const).map(([key,label]) => <div className="space-y-2" key={key}><Label htmlFor={`a-${key}`}>{label}</Label><Input id={`a-${key}`} value={address[key] ?? ""} onChange={(e) => setAddress((v) => ({...v,[key]:e.target.value}))} /></div>)}
        <div className="sm:col-span-2"><Button disabled={saveAddress.isPending}>{saveAddress.isPending ? (en ? "Saving…" : "Enregistrement…") : (en ? "Save address" : "Enregistrer l’adresse")}</Button></div>
      </form></CardContent></Card>
      <Card><CardHeader><CardTitle>{en ? "Verification" : "Vérification"}</CardTitle><CardDescription>{en ? "This is separate from your bank account status." : "État distinct du statut de votre compte bancaire."}</CardDescription></CardHeader><CardContent><StatusBadge label={data.identityStatus} tone={data.identityStatus === "VERIFIED" ? "success" : "pending"} /></CardContent></Card>
      <Card><CardHeader><CardTitle>{en ? "My bank details" : "Mes coordonnées bancaires"}</CardTitle><CardDescription>{en ? "Read-only. Balances are available under Accounts." : "Lecture seule. Les soldes restent disponibles dans la section Comptes."}</CardDescription></CardHeader><CardContent className="space-y-3">{data.accounts.length ? data.accounts.map((account) => <div key={account.reference} className="rounded-lg border p-4"><div className="flex justify-between gap-3"><div><p className="font-medium">{account.displayName}</p><p className="text-sm text-muted-foreground">{account.reference} · {account.maskedNumber}</p></div><StatusBadge label={account.status} tone={account.status === "ACTIVE" ? "success" : "pending"} /></div>{account.iban ? <p className="mt-2 text-xs text-muted-foreground">IBAN : {account.iban}</p> : null}{account.bic ? <p className="text-xs text-muted-foreground">BIC : {account.bic}</p> : null}</div>) : <p className="text-sm text-muted-foreground">{en ? "No bank account opened yet." : "Aucun compte bancaire ouvert."}</p>}</CardContent></Card>
    </div>
  </PageSection>;
}
