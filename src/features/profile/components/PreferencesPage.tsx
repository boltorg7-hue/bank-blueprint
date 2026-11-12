import { useEffect, useState } from "react";
import {
  BellRing,
  EyeOff,
  Languages,
  MonitorCog,
  Palette,
  ShieldCheck,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { PageSection } from "@/components/ui/page-section";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  usePreferences,
  useSavePreferences,
} from "@/features/profile/hooks/useProfile";
import type { CustomerPreferencesDto } from "@/features/profile/types/profile";

type ToggleKey =
  | "privacyModeDefault"
  | "smsTransactions"
  | "smsSecurity"
  | "emailService";

export function PreferencesPage() {
  const { language, setLanguage } = useLanguage();
  const en = language === "en";
  const query = usePreferences();
  const save = useSavePreferences();
  const { setTheme } = useTheme();
  const [form, setForm] = useState<CustomerPreferencesDto | null>(null);

  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);

  if (query.isError) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  if (query.isPending || !form) {
    return (
      <LoadingState
        label={en ? "Loading your preferences…" : "Chargement de vos préférences…"}
      />
    );
  }

  const updateToggle = (key: ToggleKey, value: boolean) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateLanguage = (next: "fr" | "en") => {
    setForm((current) => (current ? { ...current, language: next } : current));
  };

  const updateTheme = (next: "light" | "dark" | "system") => {
    setForm((current) => (current ? { ...current, theme: next } : current));
  };

  const hasChanges =
    form.language !== query.data?.language ||
    form.theme !== query.data?.theme ||
    form.privacyModeDefault !== query.data?.privacyModeDefault ||
    form.smsTransactions !== query.data?.smsTransactions ||
    form.smsSecurity !== query.data?.smsSecurity ||
    form.emailService !== query.data?.emailService;

  const enabledChannels = [
    form.smsTransactions,
    form.smsSecurity,
    form.emailService,
  ].filter(Boolean).length;

  async function submit() {
    try {
      const result = await save.mutateAsync(form);
      setForm(result);
      setTheme(result.theme);
      setLanguage(result.language);
      toast.success(
        result.language === "en"
          ? "Your preferences have been saved."
          : "Vos préférences ont été enregistrées.",
      );
    } catch {
      toast.error(
        en
          ? "Preferences could not be saved. Please try again."
          : "Les préférences n’ont pas pu être enregistrées. Réessayez.",
      );
    }
  }

  const toggle = (
    key: ToggleKey,
    title: string,
    description: string,
    id: string,
  ) => (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-4 last:border-0 last:pb-0">
      <div className="min-w-0 space-y-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {title}
        </Label>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={form[key]}
        onCheckedChange={(value) => updateToggle(key, value)}
      />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <PageHeader
        title={en ? "Preferences" : "Préférences"}
        description={
          en
            ? "Personalize your display and choose how the bank communicates with you."
            : "Personnalisez votre affichage et choisissez comment la banque communique avec vous."
        }
        status={
          <StatusBadge
            label={hasChanges ? (en ? "Unsaved changes" : "Modifications non enregistrées") : (en ? "Up to date" : "À jour")}
            tone={hasChanges ? "pending" : "success"}
          />
        }
      />

      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
          <PreferenceSummary
            icon="language"
            label={en ? "Interface language" : "Langue de l’interface"}
            value={form.language === "en" ? "English" : "Français"}
          />
          <PreferenceSummary
            icon="theme"
            label={en ? "Appearance" : "Apparence"}
            value={
              form.theme === "system"
                ? en
                  ? "System"
                  : "Système"
                : form.theme === "light"
                  ? en
                    ? "Light"
                    : "Clair"
                  : en
                    ? "Dark"
                    : "Sombre"
            }
          />
          <PreferenceSummary
            icon="communications"
            label={en ? "Active channels" : "Canaux activés"}
            value={`${enabledChannels}/3`}
          />
        </CardContent>
      </Card>

      <PageSection className="space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MonitorCog aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>{en ? "Display and privacy" : "Affichage et confidentialité"}</CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Choose how RF BANK looks and how sensitive amounts appear on your screen."
                    : "Choisissez l’apparence de RF BANK et la manière dont les montants sensibles s’affichent."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="preference-language">
                  {en ? "Interface language" : "Langue de l’interface"}
                </Label>
                <Select
                  value={form.language}
                  onValueChange={(value: "fr" | "en") => updateLanguage(value)}
                >
                  <SelectTrigger id="preference-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preference-theme">
                  {en ? "Theme" : "Thème"}
                </Label>
                <Select
                  value={form.theme}
                  onValueChange={(value: "light" | "dark" | "system") =>
                    updateTheme(value)
                  }
                >
                  <SelectTrigger id="preference-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">
                      {en ? "System" : "Système"}
                    </SelectItem>
                    <SelectItem value="light">
                      {en ? "Light" : "Clair"}
                    </SelectItem>
                    <SelectItem value="dark">
                      {en ? "Dark" : "Sombre"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/25 p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <EyeOff aria-hidden className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                {toggle(
                  "privacyModeDefault",
                  en ? "Hide amounts by default" : "Masquer les montants par défaut",
                  en
                    ? "Reduces exposure of balances when you use the app in public places."
                    : "Réduit l’exposition des soldes lorsque vous utilisez l’application dans un lieu public.",
                  "privacy-mode-default",
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BellRing aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>{en ? "Service communications" : "Communications de service"}</CardTitle>
                <CardDescription className="mt-1">
                  {en
                    ? "Select the channels you want to receive for account activity and service information."
                    : "Choisissez les canaux par lesquels vous souhaitez recevoir les informations sur vos comptes et les services."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {toggle(
              "smsTransactions",
              en ? "Transaction SMS" : "SMS de transaction",
              en
                ? "Credits, incoming transfers and important transaction updates."
                : "Crédits, virements reçus et mises à jour importantes sur vos opérations.",
              "sms-transactions",
            )}
            {toggle(
              "smsSecurity",
              en ? "Security SMS" : "SMS de sécurité",
              en
                ? "Sign-ins and sensitive account changes."
                : "Connexions et changements sensibles sur votre compte.",
              "sms-security",
            )}
            {toggle(
              "emailService",
              en ? "Service emails" : "E-mails de service",
              en
                ? "Documents, messages and account information."
                : "Documents, messages et informations relatives à votre compte.",
              "email-service",
            )}
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3">
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {en
                  ? "Essential security alerts may still be delivered when required to protect your account."
                  : "Certaines alertes de sécurité essentielles peuvent toujours être envoyées lorsqu’elles sont nécessaires à la protection de votre compte."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {en ? "Save your preferences" : "Enregistrer vos préférences"}
            </p>
            <p className="text-xs text-muted-foreground">
              {en
                ? "Changes take effect after you save."
                : "Les modifications prennent effet après l’enregistrement."}
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            disabled={save.isPending || !hasChanges}
            loading={save.isPending}
            loadingLabel={en ? "Saving…" : "Enregistrement…"}
            onClick={() => void submit()}
          >
            {en ? "Save preferences" : "Enregistrer les préférences"}
          </Button>
        </div>
      </PageSection>
    </div>
  );
}

function PreferenceSummary({
  icon,
  label,
  value,
}: {
  icon: "language" | "theme" | "communications";
  label: string;
  value: string;
}) {
  const Icon =
    icon === "language" ? Languages : icon === "theme" ? Palette : BellRing;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
