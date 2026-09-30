/** Server-only onboarding assistant: answers from the customer's real progress and documented requirements. */
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

import { buildOnboardingTasks } from "@/features/onboarding/lib/tasks";
import type { CustomerContext } from "@/features/onboarding/types/customer-context";
import { createOnboardingGatewayFetch } from "./ai-gateway-run-id.server";

const MODEL = "openai/gpt-6-astra";
export const MAX_QUESTIONS_PER_HOUR = 15;

type AssistantLanguage = "fr" | "en";

const REQUIREMENTS: Record<AssistantLanguage, string> = {
  fr: `Exigences documentées de l'ouverture de compte RFC FINANCE Bank (Trinité-et-Tobago, supervisée par la CBTT) :
1. Adresse e-mail confirmée via le lien le plus récent (les anciens liens sont invalidés après un renvoi ou un changement d'adresse ; 5 renvois maximum par heure, avec 60 secondes entre deux envois).
2. Informations personnelles : prénom, nom, date de naissance, nationalité, pays de résidence et profession.
3. Adresse de résidence complète (ligne d'adresse, ville, région et code postal selon le pays).
4. Vérification d'identité : une pièce d'identité (carte d'identité, passeport ou titre de séjour) ET un justificatif de domicile récent. Les fichiers doivent être lisibles, entiers et non expirés.
5. Relecture, puis envoi du dossier pour vérification.
6. Après la vérification d'identité, l'ouverture du compte bancaire fait l'objet d'un examen distinct par l'équipe conformité.
Le compte est libellé en USD. Aucun délai n'est garanti. L'équipe peut demander un document complémentaire.`,
  en: `Documented RFC FINANCE Bank account-opening requirements (Trinidad and Tobago, supervised by the CBTT):
1. Confirm the email address using the most recent link (older links are invalidated after a resend or email-address change; no more than 5 resends per hour, with 60 seconds between sends).
2. Personal information: first name, last name, date of birth, nationality, country of residence and occupation.
3. Full residential address (address line, city, region and postal code where applicable).
4. Identity verification: one identity document (identity card, passport or residence permit) AND recent proof of address. Files must be readable, complete and unexpired.
5. Review and submit the application for verification.
6. After identity verification, the compliance team conducts a separate review before the bank account is opened.
The account is denominated in USD. No completion time is guaranteed. The team may request an additional document.`,
};

const TASK_LABELS: Record<AssistantLanguage, Record<string, string>> = {
  fr: {
    email: "Adresse e-mail confirmée",
    profile: "Informations personnelles",
    address: "Adresse de résidence",
    documents: "Vérification d'identité",
    review: "Envoi du dossier",
    activation: "Ouverture du compte",
  },
  en: {
    email: "Email address confirmed",
    profile: "Personal information",
    address: "Residential address",
    documents: "Identity verification",
    review: "Application submission",
    activation: "Account opening",
  },
};

const DOCUMENT_LABELS: Record<AssistantLanguage, Record<string, string>> = {
  fr: { IDENTITY_CARD: "carte d'identité", PASSPORT: "passeport", RESIDENCE_PERMIT: "titre de séjour", PROOF_OF_ADDRESS: "justificatif de domicile" },
  en: { IDENTITY_CARD: "identity card", PASSPORT: "passport", RESIDENCE_PERMIT: "residence permit", PROOF_OF_ADDRESS: "proof of address" },
};

function describe(context: CustomerContext, language: AssistantLanguage): string {
  const en = language === "en";
  const tasks = buildOnboardingTasks(context)
    .map((task) => {
      const status = task.status === "done"
        ? (en ? "completed" : "terminé")
        : task.status === "current"
          ? (en ? "current step" : "étape en cours")
          : (en ? "to do" : "à faire");
      return `- ${TASK_LABELS[language][task.id] ?? task.title}: ${status}`;
    })
    .join("\n");
  const docs = context.documents.length
    ? context.documents.map((document) => `- ${DOCUMENT_LABELS[language][document.document_type] ?? document.document_type}: ${document.status}${document.rejection_reason ? ` (${en ? "review note" : "motif"}: ${document.rejection_reason})` : ""}`).join("\n")
    : en ? "- no document submitted" : "- aucun document envoyé";
  return `${en ? "Customer progress" : "Progression du client"}:
${tasks}
${en ? "Documents" : "Documents"}:
${docs}
${en ? "Identity-verification status" : "Statut de vérification d'identité"}: ${context.verification.status}${context.verification.requested_information ? ` — ${en ? "requested information" : "information demandée"}: ${context.verification.requested_information}` : ""}
${en ? "Account status" : "Statut du compte"}: ${context.profile.lifecycle_state}
${en ? "Declared country of residence" : "Pays de résidence déclaré"}: ${context.profile.country_of_residence ?? (en ? "not provided" : "non renseigné")}`;
}

export async function answerOnboardingQuestion(userId: string, context: CustomerContext, question: string, language: AssistantLanguage) {
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

  const gateway = createOnboardingGatewayFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: gateway.fetch,
  });

  const first = context.profile.first_name ?? "";
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system: language === "en"
        ? `You are RFC FINANCE Bank's account-opening assistant. Reply entirely in English, warmly, accurately and briefly (no more than 120 words, plain text without Markdown), addressing the customer${first ? ` (${first})` : ""}. Translate any source note that is not in English; never mix languages.
Use ONLY the progress and requirements below. State the customer's concrete next action. If the question is outside account opening or asks for a decision such as acceptance or a guaranteed completion time, explain that only the team can answer and suggest secure messaging. Never ask for a password, code or full document number. Do not invent rules.
${REQUIREMENTS.en}
${describe(context, "en")}`
        : `Tu es l'assistant d'ouverture de compte de RFC FINANCE Bank. Réponds entièrement en français, de façon chaleureuse, précise et brève (120 mots maximum, texte simple sans markdown), en t'adressant au client${first ? ` (${first})` : ""}. Traduis toute note source qui n'est pas en français ; ne mélange jamais les langues.
Base-toi UNIQUEMENT sur la progression et les exigences ci-dessous. Indique concrètement la prochaine action du client. Si la question sort du périmètre de l'ouverture de compte, ou demande une décision telle que l'acceptation ou un délai garanti, explique que seule l'équipe peut répondre et suggère la messagerie sécurisée. Ne demande jamais de mot de passe, de code ou de numéro complet de document. N'invente aucune règle.
${REQUIREMENTS.fr}
${describe(context, "fr")}`,
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
