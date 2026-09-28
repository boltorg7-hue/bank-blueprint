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
import { useLanguage } from "@/components/providers/LanguageProvider";

export function PreferencesPage() {
  const { language, setLanguage } = useLanguage();
  const query = usePreferences(); const save = useSavePreferences(); const { setTheme } = useTheme();
  const [form, setForm] = useState<CustomerPreferencesDto | null>(null);
  useEffect(() => { if (query.data) setForm(query.data); }, [query.data]);
  if (query.isPending || !form) return <LoadingState />; if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  async function submit() { if (!form) return; try { const result = await save.mutateAsync(form); if (result.theme !== "system") setTheme(result.theme); setLanguage(result.language); toast.success(language === "en" ? "Preferences saved." : "Préférences enregistrées."); } catch { toast.error(language === "en" ? "Preferences could not be saved." : "Les préférences n’ont pas pu être enregistrées."); } }
  const toggle = (key: "privacyModeDefault"|"smsTransactions"|"smsSecurity"|"emailService", label:string, description:string) => <div className="flex items-center justify-between gap-4 border-b py-4 last:border-0"><div><Label htmlFor={key}>{label}</Label><p className="text-sm text-muted-foreground">{description}</p></div><Switch id={key} checked={form[key]} onCheckedChange={(value) => setForm({...form,[key]:value})} /></div>;
  return <div className="mx-auto w-full max-w-3xl"><PageHeader title={language === "en" ? "Settings" : "Préférences"} description={language === "en" ? "Language, display and service communications." : "Langue, affichage et communications de service."} />
    <Card><CardHeader><CardTitle>{language === "en" ? "Display" : "Affichage"}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>{language === "en" ? "Language" : "Langue"}</Label><Select value={form.language} onValueChange={(next:"fr"|"en") => setForm({...form,language:next})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fr">Français</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>{language === "en" ? "Theme" : "Thème"}</Label><Select value={form.theme} onValueChange={(theme:"light"|"dark"|"system") => setForm({...form,theme})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="system">{language === "en" ? "System" : "Système"}</SelectItem><SelectItem value="light">{language === "en" ? "Light" : "Clair"}</SelectItem><SelectItem value="dark">{language === "en" ? "Dark" : "Sombre"}</SelectItem></SelectContent></Select></div>{toggle("privacyModeDefault",language === "en" ? "Hide amounts by default" : "Masquer les montants par défaut",language === "en" ? "Reduces exposure of balances in public places." : "Réduit l’exposition des soldes dans les lieux publics.")}</CardContent></Card>
    <Card className="mt-6"><CardHeader><CardTitle>{language === "en" ? "Communications" : "Communications"}</CardTitle><CardDescription>{language === "en" ? "Essential security alerts cannot all be turned off." : "Les alertes de sécurité essentielles ne peuvent pas toutes être désactivées."}</CardDescription></CardHeader><CardContent>{toggle("smsTransactions",language === "en" ? "Transaction SMS" : "SMS de transaction",language === "en" ? "Credits, incoming transfers and important transactions." : "Crédits, virements reçus et opérations importantes.")}{toggle("smsSecurity",language === "en" ? "Security SMS" : "SMS de sécurité",language === "en" ? "Sign-ins and sensitive changes." : "Connexions et changements sensibles.")}{toggle("emailService",language === "en" ? "Service emails" : "E-mails de service",language === "en" ? "Documents, messages and account information." : "Documents, messages et informations de compte.")}<Button className="mt-5" onClick={() => void submit()} disabled={save.isPending}>{save.isPending ? (language === "en" ? "Saving…" : "Enregistrement…") : language === "en" ? "Save settings" : "Enregistrer les préférences"}</Button></CardContent></Card>
  </div>;
}
