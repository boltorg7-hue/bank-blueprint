import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const askOnboardingAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ question: z.string().trim().min(3).max(600), language: z.enum(["fr", "en"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { loadCustomerContext } = await import("./onboarding.server");
    const { answerOnboardingQuestion } = await import("./onboarding-assistant.server");
    const { data: userData } = await context.supabase.auth.getUser();
    const customer = await loadCustomerContext(
      context.userId,
      userData.user?.email ?? null,
      Boolean(userData.user?.email_confirmed_at),
    );
    return answerOnboardingQuestion(context.userId, customer, data.question, data.language);
  });
