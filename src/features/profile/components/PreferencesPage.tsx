import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/feedback";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usePreferences, useSavePreferences } from "@/features/profile/hooks/useProfile";
import type { CustomerPreferencesDto } from "@/features/profile/types/profile";
import { useTheme } from "@/components/providers/ThemeProvider";

export function PreferencesPage() {
  const query = usePreferences(); const save = useSavePreferences(); const { setTheme } = useTheme();
  const [form, setForm] = useState<CustomerPreferencesDto | null>(null);
  useEffect(() => { if (query.data) setForm(query.data); }, [query.data]);
  if (query.isPending || !form) return <LoadingState />; if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  async function submit() { try { const result = await save.mutateAsync(form!); if (result.theme !== "system") setTheme(result.theme); toast.success("Préférences enregistrées."); } catch { toast.error("Les préférences n’ont pas pu être enregistrées."); } }
  const toggle = (key: "privacyModeDefault"|"smsTransactions"|"smsSecurity"|"emailService", label:string, description:string) => <div className="flex items-center justify-between gap-4 border-b py-4 last:border-0"><div><Label htmlFor={key}>{label}</Label><p className="text-sm text-muted-foreground">{description}</p></div><Switch id={key} checked={form[key]} onCheckedChange={(value) => setForm({...form,[key]:value})} /></div>;
  return <div className="mx-auto w-full max-w-3xl"><PageHeader title="Préférences" description="Langue, affichage et communications de service." />
    <Card><CardHeader><CardTitle>Affichage</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Langue</Label><Select value={form.language} onValueChange={(language:"fr"|"en") => setForm({...form,language})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fr">Français</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Thème</Label><Select value={form.theme} onValueChange={(theme:"light"|"dark"|"system") => setForm({...form,theme})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="system">Système</SelectItem><SelectItem value="light">Clair</SelectItem><SelectItem value="dark">Sombre</SelectItem></SelectContent></Select></div>{toggle("privacyModeDefault","Masquer les montants par défaut","Réduit l’exposition des soldes dans les lieux publics.")}</CardContent></Card>
    <Card className="mt-6"><CardHeader><CardTitle>Communications</CardTitle><CardDescription>Les alertes de sécurité essentielles ne peuvent pas toutes être désactivées.</CardDescription></CardHeader><CardContent>{toggle("smsTransactions","SMS de transaction","Crédits, virements reçus et opérations importantes.")}{toggle("smsSecurity","SMS de sécurité","Connexions et changements sensibles.")}{toggle("emailService","E-mails de service","Documents, messages et informations de compte.")}<Button className="mt-5" onClick={() => void submit()} disabled={save.isPending}>{save.isPending ? "Enregistrement…" : "Enregistrer les préférences"}</Button></CardContent></Card>
  </div>;
}
