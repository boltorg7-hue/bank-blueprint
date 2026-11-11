import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquareText, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { OnboardingShell } from "@/features/onboarding/components/OnboardingShell";
import { useCustomerContext, useInvalidateCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import {
  changePendingPhone,
  sendContactVerificationCode,
  verifyContactCode,
} from "@/features/onboarding/services/onboarding.functions";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/verify-contact")({
  head: () => ({ meta: [{ title: "Vérification du téléphone — RFC" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: VerifyContactPage,
});

function VerifyContactPage() {
  const { language } = useLanguage();
  const en = language === "en";
  const navigate = useNavigate();
  const { data: context, isPending } = useCustomerContext();
  const invalidate = useInvalidateCustomerContext();
  const send = useServerFn(sendContactVerificationCode);
  const verify = useServerFn(verifyContactCode);
  const change = useServerFn(changePendingPhone);
  const [code, setCode] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (context?.profile.phone_verified_at) void navigate({ to: "/onboarding", replace: true });
  }, [context?.profile.phone_verified_at, navigate]);

  async function handleSend() {
    setError(null); setMessage(null); setSending(true);
    try {
      const result = await send({ data: undefined });
      setMessage(result.alreadyVerified
        ? (en ? "This phone number is already verified." : "Ce numéro est déjà vérifié.")
        : (en ? "A verification code has been sent by SMS." : "Un code de vérification a été envoyé par SMS."));
    } catch (e) {
      setError(errorMessage(e, en));
    } finally { setSending(false); }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault(); setError(null); setMessage(null); setPending(true);
    try {
      await verify({ data: { code } });
      await invalidate();
      await navigate({ to: "/onboarding", replace: true });
    } catch (e) {
      setError(errorMessage(e, en));
    } finally { setPending(false); }
  }

  async function handleChangePhone(event: React.FormEvent) {
    event.preventDefault(); setError(null); setMessage(null); setSavingPhone(true);
    try {
      await change({ data: { phone: newPhone } });
      await invalidate();
      setCode("");
      setNewPhone("");
      setEditing(false);
      setMessage(en
        ? "Your number has been changed. Request a new verification code."
        : "Votre numéro a été modifié. Demandez un nouveau code de vérification.");
    } catch (e) {
      setError(errorMessage(e, en));
    } finally { setSavingPhone(false); }
  }

  if (isPending || !context) return <OnboardingShell title={en ? "Verify your phone" : "Vérifier votre téléphone"}><Spinner /></OnboardingShell>;

  return (
    <OnboardingShell
      title={en ? "Verify your phone number" : "Vérifiez votre numéro de téléphone"}
      description={en ? `We use ${context.profile.phone ?? "your phone"} to secure your customer account.` : `Nous utilisons ${context.profile.phone ?? "votre téléphone"} pour sécuriser votre espace client.`}
    >
      <div className="rounded-xl border border-border bg-surface px-4 py-4">
        <div className="flex items-start gap-3">
          <MessageSquareText className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-label text-foreground">{en ? "Verification channel" : "Canal de vérification"}</p>
            <p className="mt-1 text-body-sm text-muted-foreground">
              {en
                ? "SMS is available for your international phone number. A code expires after 10 minutes and allows up to five attempts."
                : "Le SMS est disponible pour votre numéro international. Le code expire après 10 minutes et autorise cinq tentatives maximum."}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleVerify} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="contact-code">{en ? "6-digit code" : "Code à 6 chiffres"}</Label>
          <Input id="contact-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\\D/g, "").slice(0, 6))} required />
        </div>
        {error ? <p role="alert" className="text-body-sm rounded-lg bg-destructive/10 px-3 py-2 text-destructive">{error}</p> : null}
        {message ? <p role="status" className="text-body-sm rounded-lg bg-success-muted px-3 py-2 text-foreground">{message}</p> : null}
        <Button type="submit" className="w-full touch-target" loading={pending} disabled={code.length !== 6}>{en ? "Verify phone" : "Vérifier le téléphone"}</Button>
        <Button type="button" variant="outline" className="w-full touch-target" loading={sending} onClick={() => void handleSend()}>{en ? "Send code by SMS" : "Recevoir le code par SMS"}</Button>
      </form>

      {editing ? (
        <form onSubmit={(event) => void handleChangePhone(event)} className="mt-4 space-y-3 rounded-xl border border-border bg-surface p-4">
          <Label htmlFor="new-phone">{en ? "New international phone number" : "Nouveau numéro de téléphone international"}</Label>
          <Input id="new-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+237 6 99 99 99 99" value={newPhone} onChange={(event) => setNewPhone(event.target.value)} required />
          <p className="text-caption text-muted-foreground">
            {en ? "Use the international format (+country code). Your previous verification code will be invalidated." : "Utilisez le format international (+indicatif du pays). Votre ancien code de vérification sera invalidé."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="w-full touch-target" loading={savingPhone}>{en ? "Save new number" : "Enregistrer le nouveau numéro"}</Button>
            <Button type="button" variant="outline" className="w-full touch-target" onClick={() => { setEditing(false); setNewPhone(""); }}>{en ? "Cancel" : "Annuler"}</Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="ghost" className="mt-3 w-full touch-target" onClick={() => { setError(null); setMessage(null); setNewPhone(context.profile.phone ?? ""); setEditing(true); }}>
          <PencilLine className="size-4" aria-hidden="true" />
          {en ? "Wrong number? Change my phone" : "Numéro incorrect ? Modifier mon numéro"}
        </Button>
      )}

      <Button asChild variant="ghost" className="mt-3 w-full"><Link to="/onboarding">{en ? "Back to onboarding" : "Retour à l’onboarding"}</Link></Button>
    </OnboardingShell>
  );
}

function errorMessage(error: unknown, en: boolean) {
  const code = error instanceof Error ? error.message : "";
  const messages: Record<string, [string, string]> = {
    OTP_COOLDOWN: ["Wait before requesting another code.", "Attendez avant de demander un nouveau code."],
    OTP_EXPIRED: ["This code has expired. Request a new one.", "Ce code a expiré. Demandez-en un nouveau."],
    OTP_INVALID: ["The code is incorrect.", "Le code est incorrect."],
    OTP_LOCKED: ["Too many attempts. Request a new code.", "Trop de tentatives. Demandez un nouveau code."],
    OTP_NOT_FOUND: ["No active code. Request a new one.", "Aucun code actif. Demandez-en un nouveau."],
    PHONE_REQUIRED: ["A phone number is required.", "Un numéro de téléphone est requis."],
    PHONE_UNCHANGED: ["This is already your current number.", "C’est déjà votre numéro actuel."],
    INVALID_PHONE: ["Enter a valid international number in E.164 format.", "Saisissez un numéro international valide au format E.164."],
    ONBOARDING_STATE_LOCKED: ["This number cannot be changed at the current onboarding stage.", "Le numéro ne peut pas être modifié à cette étape du dossier."],
    OTP_SECRET_NOT_CONFIGURED: ["Phone verification is temporarily unavailable.", "La vérification téléphonique est temporairement indisponible."],
    SMS_DELIVERY_FAILED: ["The SMS could not be delivered. Please try again later.", "Le SMS n’a pas pu être envoyé. Réessayez plus tard."],
    SMS_SIMULATED_NOT_DELIVERED: ["SMS simulation is enabled; no real message was sent.", "Le mode simulation est activé : aucun vrai SMS n’a été envoyé."],
  };
  return messages[code]?.[en ? 0 : 1] ?? (en ? "Verification failed. Please try again." : "La vérification a échoué. Réessayez.");
}
