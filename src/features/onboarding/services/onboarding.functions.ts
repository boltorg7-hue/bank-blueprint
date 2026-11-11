import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { internationalPhoneSchema } from "@/features/onboarding/schemas/onboarding.schemas";

export const changePendingPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ phone: internationalPhoneSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertCustomerConsent } = await import("@/features/auth/services/oauth-consent.server");
    await assertCustomerConsent(context.userId);
    const service = await import("@/features/onboarding/services/contact-verification.server");
    return service.changePendingPhone(context.userId, data.phone);
  });

export const sendContactVerificationCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertCustomerConsent } = await import("@/features/auth/services/oauth-consent.server");
    await assertCustomerConsent(context.userId);
    const service = await import("@/features/onboarding/services/contact-verification.server");
    return service.sendContactVerificationCode(context.userId);
  });

export const verifyContactCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().regex(/^\d{6}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertCustomerConsent } = await import("@/features/auth/services/oauth-consent.server");
    await assertCustomerConsent(context.userId);
    const service = await import("@/features/onboarding/services/contact-verification.server");
    return service.verifyContactCode(context.userId, data.code);
  });
