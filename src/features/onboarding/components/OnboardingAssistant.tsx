import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircleQuestion, Send, Sparkles } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askOnboardingAssistant } from "@/features/onboarding/services/onboarding-assistant.functions";

type Entry = { question: string; answer?: string; error?: string };

/** Personalised Q&A about the customer's own account-opening progress. */
export function OnboardingAssistant() {
  const { language } = useLanguage();
  const en = language === "en";
  const ask = useServerFn(askOnboardingAssistant);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);

  const suggestions = en
    ? ["What should I do next?", "Which documents are accepted?", "Why is my application pending?"]
    : ["Que dois-je faire maintenant ?", "Quels documents sont acceptés ?", "Pourquoi mon dossier est-il en attente ?"];

  const errors: Record<string, [string, string]> = {
    RATE_LIMITED: ["Vous avez posé beaucoup de questions. Réessayez dans une heure.", "You've asked many questions. Try again in an hour."],
    BUSY: ["L'assistant est très sollicité. Réessayez dans un instant.", "The assistant is busy. Try again shortly."],
    UNAVAILABLE: ["L'assistant est momentanément indisponible. Utilisez la messagerie sécurisée.", "The assistant is temporarily unavailable. Use secure messaging."],
  };

  async function submit(text: string) {
    const q = text.trim();
    if (q.length < 3 || pending) return;
    setPending(true);
    setQuestion("");
    setEntries((list) => [...list, { question: q }]);
    let entry: Entry;
    try {
      const result = await ask({ data: { question: q, language: en ? "en" : "fr" } });
      entry = result.ok
        ? { question: q, answer: result.answer }
        : { question: q, error: (errors[result.code] ?? [ "Réponse impossible pour le moment.", "No answer available right now."])[en ? 1 : 0] };
    } catch {
      entry = { question: q, error: en ? "No answer available right now." : "Réponse impossible pour le moment." };
    }
    setEntries((list) => [...list.slice(0, -1), entry]);
    setPending(false);
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" className="mt-6 w-full touch-target justify-start gap-2" onClick={() => setOpen(true)}>
        <MessageCircleQuestion className="size-4" aria-hidden="true" />
        {en ? "A question about your account opening?" : "Une question sur votre ouverture de compte ?"}
      </Button>
    );
  }

  return (
    <section aria-label={en ? "Account-opening assistant" : "Assistant d'ouverture de compte"} className="mt-6 space-y-4 rounded-2xl border border-border bg-surface p-4">
      <header className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-label text-foreground">{en ? "Account-opening assistant" : "Assistant d'ouverture de compte"}</p>
          <p className="text-caption text-muted-foreground">
            {en ? "Answers based on your progress. Final decisions are made by our team." : "Réponses basées sur votre progression. Les décisions finales reviennent à notre équipe."}
          </p>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <Button key={s} type="button" size="sm" variant="secondary" className="min-h-11" onClick={() => void submit(s)}>
              {s}
            </Button>
          ))}
        </div>
      ) : (
        <ul className="space-y-3" aria-live="polite">
          {entries.map((e, i) => (
            <li key={i} className="space-y-2">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-body-sm text-primary-foreground">{e.question}</p>
              <p className={`w-fit max-w-[95%] whitespace-pre-line rounded-2xl bg-background px-3 py-2 text-body-sm ${e.error ? "text-destructive" : "text-foreground"}`}>
                {e.answer ?? e.error ?? (en ? "Thinking…" : "Réflexion en cours…")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(question);
        }}
      >
        <Textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={600}
          rows={2}
          placeholder={en ? "Ask your question…" : "Posez votre question…"}
          aria-label={en ? "Your question" : "Votre question"}
          className="min-h-11 flex-1 resize-none"
        />
        <Button type="submit" size="icon" className="size-11 shrink-0" loading={pending} disabled={question.trim().length < 3} aria-label={en ? "Send" : "Envoyer"}>
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </section>
  );
}
