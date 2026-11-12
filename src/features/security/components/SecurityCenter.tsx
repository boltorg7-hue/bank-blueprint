import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  KeyRound,
  Laptop,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { useSessionUser } from "@/features/auth/hooks/useSessionUser";
import { passwordSchema } from "@/features/auth/schemas/auth.schemas";
import {
  useCloseOtherSessions,
  useRecordPasswordChanged,
  useRegisterSecuritySession,
  useSecurityOverview,
} from "@/features/security/hooks/useSecurity";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";

export function SecurityCenter() {
  const { language } = useLanguage();
  const en = language === "en";
  const overview = useSecurityOverview();
  const register = useRegisterSecuritySession();
  const closeOthers = useCloseOtherSessions();
  const recordPassword = useRecordPasswordChanged();
  const { user } = useSessionUser();
  const registered = useRef(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    const label = [navigator.platform, navigator.userAgent]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 240);
    register.mutate(label);
  }, [register]);

  const requirements = [
    {
      label: en ? "At least 12 characters" : "12 caractères minimum",
      met: newPassword.length >= 12,
    },
    {
      label: en
        ? "Uppercase and lowercase letters"
        : "Une lettre majuscule et une minuscule",
      met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    },
    {
      label: en ? "At least one number" : "Au moins un chiffre",
      met: /\d/.test(newPassword),
    },
  ];

  async function closeAllOthers() {
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      const result = await closeOthers.mutateAsync();
      toast.success(
        `${result.count} ${en ? "other session(s) closed." : "autre(s) session(s) fermée(s)."}`,
      );
    } catch {
      toast.error(
        en
          ? "Other sessions could not be closed."
          : "Les autres sessions n’ont pas pu être fermées.",
      );
    }
  }

  async function changePassword() {
    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ??
          (en ? "Invalid new password." : "Nouveau mot de passe invalide."),
      );
      return;
    }
    if (newPassword !== confirmation) {
      toast.error(
        en
          ? "New passwords do not match."
          : "Les nouveaux mots de passe ne correspondent pas.",
      );
      return;
    }
    if (!user?.email || !currentPassword) {
      toast.error(
        en
          ? "Enter your current password."
          : "Saisissez votre mot de passe actuel.",
      );
      return;
    }

    setChanging(true);
    try {
      const auth = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (auth.error) throw auth.error;

      const update = await supabase.auth.updateUser({ password: newPassword });
      if (update.error) throw update.error;

      await recordPassword.mutateAsync();
      const label = [navigator.platform, navigator.userAgent]
        .filter(Boolean)
        .join(" — ")
        .slice(0, 240);
      await register.mutateAsync(label);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      toast.success(
        en
          ? "Password changed. A security alert was created."
          : "Mot de passe modifié. Une alerte de sécurité a été créée.",
      );
    } catch {
      toast.error(
        en
          ? "Password could not be changed. Check your current password."
          : "Le mot de passe n’a pas pu être modifié. Vérifiez votre mot de passe actuel.",
      );
    } finally {
      setChanging(false);
    }
  }

  if (overview.isPending) {
    return (
      <LoadingState
        label={en ? "Loading your security settings…" : "Chargement de votre sécurité…"}
      />
    );
  }

  if (overview.isError) {
    return <ErrorState onRetry={() => void overview.refetch()} />;
  }

  const sessions = overview.data?.sessions ?? [];
  const events = overview.data?.events ?? [];
  const activeSessions = sessions.filter((session) => !session.revokedAt).length;
  const otherActiveSessions = sessions.filter(
    (session) => !session.current && !session.revokedAt,
  ).length;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.10] via-card to-card">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck aria-hidden className="size-6" />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground">
                {en ? "Your account security" : "La sécurité de votre compte"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {en
                  ? "Review your sign-in activity and keep your access protected."
                  : "Vérifiez votre activité de connexion et protégez vos accès."}
              </p>
            </div>
          </div>
          <StatusBadge
            label={en ? "Protected area" : "Espace protégé"}
            tone="success"
          />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <SecuritySummary
          icon="sessions"
          label={en ? "Recorded sessions" : "Sessions enregistrées"}
          value={sessions.length}
        />
        <SecuritySummary
          icon="active"
          label={en ? "Active sessions" : "Sessions actives"}
          value={activeSessions}
        />
        <SecuritySummary
          icon="events"
          label={en ? "Security events" : "Événements de sécurité"}
          value={events.length}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound aria-hidden className="size-5" />
            </span>
            <div className="min-w-0">
              <CardTitle>{en ? "Change password" : "Modifier le mot de passe"}</CardTitle>
              <CardDescription className="mt-1">
                {en
                  ? "Your current password is verified before any change is made."
                  : "Votre mot de passe actuel est vérifié avant toute modification."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void changePassword();
            }}
          >
            <PasswordInput
              id="current-password"
              label={en ? "Current password" : "Mot de passe actuel"}
              value={currentPassword}
              setValue={setCurrentPassword}
              autoComplete="current-password"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <PasswordInput
                id="new-password"
                label={en ? "New password" : "Nouveau mot de passe"}
                value={newPassword}
                setValue={setNewPassword}
                autoComplete="new-password"
              />
              <PasswordInput
                id="confirm-password"
                label={en ? "Confirm new password" : "Confirmer le nouveau mot de passe"}
                value={confirmation}
                setValue={setConfirmation}
                autoComplete="new-password"
              />
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
              <p className="mb-2 text-xs font-semibold text-foreground">
                {en ? "Password requirements" : "Exigences du mot de passe"}
              </p>
              <ul className="grid gap-2 sm:grid-cols-3">
                {requirements.map((requirement) => (
                  <li
                    key={requirement.label}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    {requirement.met ? (
                      <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />
                    ) : (
                      <span className="size-4 shrink-0 rounded-full border border-border" />
                    )}
                    <span>{requirement.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {en
                  ? "Never share your password or verification codes."
                  : "Ne partagez jamais votre mot de passe ni vos codes de vérification."}
              </p>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={
                  changing ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmation
                }
                loading={changing}
                loadingLabel={en ? "Updating…" : "Modification…"}
              >
                {en ? "Update password" : "Mettre à jour le mot de passe"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{en ? "Sessions and devices" : "Sessions et appareils"}</CardTitle>
              <CardDescription className="mt-1">
                {en
                  ? "Sessions recorded by the app. Actual revocation is handled by Supabase Auth."
                  : "Sessions enregistrées par l’application. La révocation réelle est gérée par Supabase Auth."}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={closeOthers.isPending || otherActiveSessions === 0}
              loading={closeOthers.isPending}
              loadingLabel={en ? "Closing…" : "Fermeture…"}
              onClick={() => void closeAllOthers()}
            >
              {en ? "Close other sessions" : "Fermer les autres sessions"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <EmptyState
              title={en ? "No sessions recorded" : "Aucune session enregistrée"}
              description={
                en
                  ? "Your active devices will appear here after they are registered."
                  : "Vos appareils actifs apparaîtront ici après leur enregistrement."
              }
            />
          ) : (
            sessions.map((session) => {
              const mobile = /android|iphone|ipad|mobile/i.test(session.deviceLabel);
              const DeviceIcon = mobile ? Smartphone : Laptop;
              const statusLabel = session.current
                ? en
                  ? "Current session"
                  : "Session actuelle"
                : session.revokedAt
                  ? en
                    ? "Closed"
                    : "Fermée"
                  : en
                    ? "Active"
                    : "Active";

              return (
                <div
                  key={session.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                      <DeviceIcon aria-hidden className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-foreground">
                        {session.deviceLabel}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {en ? "Last active" : "Dernière activité"} ·{" "}
                        {formatDateTime(session.lastSeenAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {en ? "First seen" : "Première activité"} ·{" "}
                        {formatDateTime(session.firstSeenAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    label={statusLabel}
                    tone={
                      session.current
                        ? "success"
                        : session.revokedAt
                          ? "neutral"
                          : "info"
                    }
                  />
                </div>
              );
            })
          )}
          <p className="text-xs text-muted-foreground">
            {en
              ? "Closing other sessions does not close the session currently used on this device."
              : "La fermeture des autres sessions ne ferme pas la session actuellement utilisée sur cet appareil."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock3 aria-hidden className="size-5" />
            </span>
            <div className="min-w-0">
              <CardTitle>{en ? "Security history" : "Historique de sécurité"}</CardTitle>
              <CardDescription className="mt-1">
                {en
                  ? "Recent changes and security-related activity on your account."
                  : "Modifications récentes et activités liées à la sécurité de votre compte."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <EmptyState
              title={en ? "No security events yet" : "Aucun événement de sécurité"}
              description={
                en
                  ? "Important security changes will be listed here."
                  : "Les changements importants liés à la sécurité seront affichés ici."
              }
            />
          ) : (
            events.map((event) => {
              const warning = /failed|rejected|suspicious|blocked/i.test(
                `${event.type} ${event.title}`,
              );
              const EventIcon = warning ? AlertTriangle : ShieldCheck;

              return (
                <div
                  key={event.id}
                  className="flex gap-3 border-b border-border/70 pb-3 last:border-0 last:pb-0"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${warning ? "bg-warning/10 text-warning" : "bg-muted text-primary"}`}
                  >
                    <EventIcon aria-hidden className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <strong className="text-sm text-foreground">{event.title}</strong>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(event.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {event.detail}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SecuritySummary({
  icon,
  label,
  value,
}: {
  icon: "sessions" | "active" | "events";
  label: string;
  value: number;
}) {
  const Icon = icon === "active" ? ShieldCheck : icon === "events" ? Clock3 : Laptop;

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3 sm:p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PasswordInput({
  id,
  label,
  value,
  setValue,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  setValue: (value: string) => void;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={128}
      />
    </div>
  );
}
