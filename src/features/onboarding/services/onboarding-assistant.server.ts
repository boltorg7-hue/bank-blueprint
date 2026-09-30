/** Server-only onboarding assistant: answers from the customer's real progress and documented requirements. */
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

import { buildOnboardingTasks } from "@/features/onboarding/lib/tasks";
import type { CustomerContext } from "@/features/onboarding/types/customer-context";

const MODEL = "openai/gpt-6-astra";
export const MAX_QUESTIONS_PER_HOUR = 15;

const REQUIREMENTS = `
Exigences documentées de l'ouverture de compte RFC FINANCE Bank (Trinité-et-Tobago, supervisée par la CBTT) :
1. Adresse e-mail confirmée via le lien le plus récent (les anciens liens sont invalidés après un renvoi ou un changement d'adresse ; 5 renvois max par heure, 60 s entre deux envois).
2. Informations personnelles : prénom, nom, date de naissance, nationalité, pays de résidence, profession.
3. Adresse de résidence complète (ligne d'adresse, ville, région, code postal selon le pays).
4. Vérification d'identité : une pièce d'identité (carte d'identité, passeport ou titre de séjour) ET un justificatif de domicile récent. Fichiers lisibles, entiers, non expirés.
5. Relecture puis envoi du dossier pour vérification.
6. Après vérification d'identité, l'ouverture du compte bancaire fait l'objet d'un examen distinct par l'équipe conformité.
Le compte est libellé en USD. Aucun délai n'est garanti. L'équipe peut demander un document complémentaire.
`;

function describe(context: CustomerContext): string {
  const tasks = buildOnboardingTasks(context)
    .map((t) => `- ${t.title} : ${t.status === "done" ? "terminé" : t.status === "current" ? "étape en cours" : "à faire"}`)
    .join("\n");
  const docs = context.documents.length
    ? context.documents.map((d) => `- ${d.document_type} : ${d.status}${d.rejection_reason ? ` (motif : ${d.rejection_reason})` : ""}`).join("\n")
    : "- aucun document envoyé";
  return `Progression du client :
${tasks}
Documents :
${docs}
Statut de vérification d'identité : ${context.verification.status}${context.verification.requested_information ? ` — information demandée : ${context.verification.requested_information}` : ""}
Statut du compte : ${context.profile.lifecycle_state}
Pays de résidence déclaré : ${context.profile.country_of_residence ?? "non renseigné"}`;
}

export async function answerOnboardingQuestion(userId: string, context: CustomerContext, question: string, language: "fr" | "en") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabaseAdmin
    .from("onboarding_assistant_questions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_QUESTIONS_PER_HOUR) return { ok: false as const, code: "RATE_LIMITED" as const };
  await supabaseAdmin.from("onboarding_assistant_questions").insert({ user_id: userId });

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false as const, code: "UNAVAILABLE" as const };

  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  const first = context.profile.first_name ?? "";
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system: `Tu es l'assistant d'ouverture de compte de RFC FINANCE Bank. Réponds ${language === "en" ? "en anglais" : "en français"}, de façon chaleureuse, précise et brève (120 mots maximum, texte simple sans markdown), en t'adressant au client${first ? ` (${first})` : ""}.
Base-toi UNIQUEMENT sur la progression et les exigences ci-dessous. Indique concrètement la prochaine action. Si la question sort du périmètre de l'ouverture de compte, ou demande une décision (acceptation, délai garanti), dis que seule l'équipe peut répondre et suggère la messagerie sécurisée. Ne demande jamais de mot de passe, code ou numéro complet de document. N'invente aucune règle.
${REQUIREMENTS}
${describe(context)}`,
      messages: [{ role: "user", content: question }],
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const text = (await result.text).trim();
    if (!text) return { ok: false as const, code: "EMPTY" as const };
    return { ok: true as const, answer: text };
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 429) return { ok: false as const, code: "BUSY" as const };
    if (status === 402) return { ok: false as const, code: "UNAVAILABLE" as const };
    return { ok: false as const, code: "ERROR" as const };
  }
}
