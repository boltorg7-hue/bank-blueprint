import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { useProfileOverview, useSaveAddress, useSaveProfile } from "@/features/profile/hooks/useProfile";
import { LIFECYCLE_LABELS } from "@/types/customer-lifecycle";

type Form = Record<string, string>;
export function ProfilePage() {
  const query = useProfileOverview(); const saveProfile = useSaveProfile(); const saveAddress = useSaveAddress();
  const [profile, setProfile] = useState<Form>({}); const [address, setAddress] = useState<Form>({});
  useEffect(() => { if (!query.data) return; const p = query.data; setProfile({ firstName:p.firstName,middleName:p.middleName,lastName:p.lastName,dateOfBirth:p.dateOfBirth,nationality:p.nationality,countryOfResidence:p.countryOfResidence,occupation:p.occupation,phone:p.phone }); setAddress(p.address); }, [query.data]);
  if (query.isPending) return <LoadingState label="Chargement de votre profil…" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const data = query.data; const field = (key: string, label: string, type = "text", locked = false) => <div className="space-y-2"><Label htmlFor={key}>{label}</Label><Input id={key} type={type} value={profile[key] ?? ""} disabled={locked} onChange={(e) => setProfile((v) => ({...v,[key]:e.target.value}))} /></div>;
  async function submitProfile(e: React.FormEvent) { e.preventDefault(); try { await saveProfile.mutateAsync(profile); toast.success("Informations personnelles enregistrées."); } catch { toast.error("Les informations n’ont pas pu être enregistrées."); } }
  async function submitAddress(e: React.FormEvent) { e.preventDefault(); try { await saveAddress.mutateAsync(address); toast.success("Adresse enregistrée."); } catch { toast.error("L’adresse n’a pas pu être enregistrée."); } }
  return <div className="mx-auto w-full max-w-4xl">
    <PageHeader title="Mon profil" description="Vos informations personnelles, votre vérification et vos coordonnées bancaires." status={<StatusBadge label={LIFECYCLE_LABELS[data.lifecycleState]} tone={data.lifecycleState === "ACTIVE" ? "success" : "pending"} />} />
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Identité et coordonnées</CardTitle><CardDescription>{data.identityLocked ? "Les informations d’identité vérifiées sont verrouillées. Contactez le service client pour les corriger." : "Ces informations doivent correspondre à vos documents d’identité."}</CardDescription></CardHeader><CardContent><form onSubmit={submitProfile} className="grid gap-4 sm:grid-cols-2">
        {field("firstName","Prénom","text",data.identityLocked)}{field("middleName","Autres prénoms","text",data.identityLocked)}{field("lastName","Nom","text",data.identityLocked)}{field("dateOfBirth","Date de naissance","date",data.identityLocked)}{field("nationality","Nationalité","text",data.identityLocked)}{field("countryOfResidence","Pays de résidence")}{field("occupation","Profession")}{field("phone","Téléphone","tel")}
        <div className="space-y-2"><Label>E-mail</Label><Input value={data.email ?? ""} disabled /><p className="text-xs text-muted-foreground">{data.emailVerified ? "Adresse vérifiée" : "Adresse non vérifiée"}</p></div>
        <div className="sm:col-span-2"><Button disabled={saveProfile.isPending}>{saveProfile.isPending ? "Enregistrement…" : "Enregistrer le profil"}</Button></div>
      </form></CardContent></Card>
      <Card><CardHeader><CardTitle>Adresse principale</CardTitle><CardDescription>Adresse utilisée pour votre dossier client.</CardDescription></CardHeader><CardContent><form onSubmit={submitAddress} className="grid gap-4 sm:grid-cols-2">
        {[["country","Pays"],["addressLine1","Adresse"],["addressLine2","Complément"],["city","Ville"],["region","Région"],["postalCode","Code postal"]].map(([key,label]) => <div className="space-y-2" key={key}><Label htmlFor={`a-${key}`}>{label}</Label><Input id={`a-${key}`} value={address[key] ?? ""} onChange={(e) => setAddress((v) => ({...v,[key]:e.target.value}))} /></div>)}
        <div className="sm:col-span-2"><Button disabled={saveAddress.isPending}>{saveAddress.isPending ? "Enregistrement…" : "Enregistrer l’adresse"}</Button></div>
      </form></CardContent></Card>
      <Card><CardHeader><CardTitle>Vérification</CardTitle><CardDescription>État distinct du statut de votre compte bancaire.</CardDescription></CardHeader><CardContent><StatusBadge label={data.identityStatus} tone={data.identityStatus === "VERIFIED" ? "success" : "pending"} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Mes coordonnées bancaires</CardTitle><CardDescription>Lecture seule. Les soldes restent disponibles dans la section Comptes.</CardDescription></CardHeader><CardContent className="space-y-3">{data.accounts.length ? data.accounts.map((account) => <div key={account.reference} className="rounded-lg border p-4"><div className="flex justify-between gap-3"><div><p className="font-medium">{account.displayName}</p><p className="text-sm text-muted-foreground">{account.reference} · {account.maskedNumber}</p></div><StatusBadge label={account.status} tone={account.status === "ACTIVE" ? "success" : "pending"} /></div>{account.iban ? <p className="mt-2 text-xs text-muted-foreground">IBAN : {account.iban}</p> : null}{account.bic ? <p className="text-xs text-muted-foreground">BIC : {account.bic}</p> : null}</div>) : <p className="text-sm text-muted-foreground">Aucun compte bancaire ouvert.</p>}</CardContent></Card>
    </div>
  </div>;
}
