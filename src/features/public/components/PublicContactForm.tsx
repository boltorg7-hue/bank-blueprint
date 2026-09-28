import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { CONTACT_TOPICS_EN } from "@/features/public/content/help-en";
import { ShieldAlert } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_TOPICS } from "@/features/public/content/help";
import { SECURITY_WARNING } from "@/features/public/content/site";

/**
 * Public contact form (§46).
 * Collects only name, email, topic and message. Never asks for passwords,
 * PIN codes, one-time codes or card credentials.
 *
 * Message delivery is a backend concern (later phase): until the messaging
 * service exists, submission validates the input and tells the customer
 * plainly that the form is not yet connected, instead of pretending to send.
 */
const contactSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(80, "Nom trop long."),
  email: z.string().trim().email("Adresse e-mail invalide."),
  topic: z.string().min(1, "Choisissez un sujet."),
  message: z
    .string()
    .trim()
    .min(20, "Décrivez votre demande en 20 caractères minimum.")
    .max(1500, "Message trop long (1500 caractères maximum)."),
});

type FieldErrors = Partial<Record<"name" | "email" | "topic" | "message", string>>;

export function PublicContactForm() {
  const { language } = useLanguage();
  const en = language === "en";
  const copy = (fr: string, english: string) => en ? english : fr;
  const [topic, setTopic] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = contactSchema.safeParse({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      topic,
      message: String(formData.get("message") ?? ""),
    });

    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !next[key]) next[key] = en ? ({ name: "Enter your name (2–80 characters).", email: "Enter a valid email address.", topic: "Choose a topic.", message: "Write a message of 20–1500 characters." }[key]) : issue.message;
      }
      setErrors(next);
      setNotice(null);
      return;
    }

    setErrors({});
    setNotice(
      copy("Votre demande est complète, mais l’envoi n’est pas encore activé sur ce site. La messagerie sécurisée sera disponible avec l’ouverture des comptes.", "Your request is complete, but this form is not connected yet. Secure messaging is available to customers in their account."),
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div
        className="flex gap-3 rounded-xl border border-warning/30 bg-warning-muted px-4 py-3"
        role="note"
      >
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
        <p className="text-body-sm text-foreground">{copy(SECURITY_WARNING, "Never share your password or a verification code.")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-name">{copy("Nom", "Name")}</Label>
        <Input
          id="contact-name"
          name="name"
          autoComplete="name"
          className="h-12"
          aria-invalid={Boolean(errors.name)}
          {...(errors.name ? { "aria-describedby": "contact-name-error" } : {})}
        />
        {errors.name && (
          <p id="contact-name-error" className="text-caption text-danger">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">{copy("Adresse e-mail", "Email address")}</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="h-12"
          aria-invalid={Boolean(errors.email)}
          {...(errors.email ? { "aria-describedby": "contact-email-error" } : {})}
        />
        {errors.email && (
          <p id="contact-email-error" className="text-caption text-danger">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-topic">{copy("Sujet", "Topic")}</Label>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger id="contact-topic" className="h-12" aria-invalid={Boolean(errors.topic)}>
            <SelectValue placeholder={copy("Choisissez un sujet", "Choose a topic")} />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_TOPICS.map((item, index) => (
              <SelectItem key={item} value={item}>
                {en ? CONTACT_TOPICS_EN[index] : item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.topic && <p className="text-caption text-danger">{errors.topic}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          rows={6}
          placeholder={copy("Décrivez votre demande. N’indiquez jamais de mot de passe ni de code de vérification.", "Describe your request. Never include a password or verification code.")}
          aria-invalid={Boolean(errors.message)}
          {...(errors.message ? { "aria-describedby": "contact-message-error" } : {})}
        />
        {errors.message && (
          <p id="contact-message-error" className="text-caption text-danger">
            {errors.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        {copy("Envoyer la demande", "Send request")}
      </Button>

      <p className="text-caption text-muted-foreground" aria-live="polite" role="status">
        {notice}
      </p>
    </form>
  );
}
