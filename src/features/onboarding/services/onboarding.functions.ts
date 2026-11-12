import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { internationalPhoneSchema } from "@/features/onboarding/schemas/onboarding.schemas";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CustomerContext } from "@/domain/onboarding/types";

async function assertConsent(userId: string) {
  const { assertCustomerConsent } = await import("@/features/auth/services/oauth-consent.server");
  await assertCustomerConsent(userId);
}

export const getCustomerContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomerContext> => {
    await assertConsent(context.userId);
    const { loadCustomerContext } =
      await import("@/features/onboarding/services/onboarding.server");
    const claims = context.claims as { email?: string; email_verified?: boolean } | null;
    const { data } = await context.supabase.auth.getUser();
    if (!data.user) throw new Error("CUSTOMER_AUTH_UNAVAILABLE");
    return loadCustomerContext(
      context.userId,
      data.user.email ?? claims?.email ?? null,
      Boolean(data.user.email_confirmed_at),
      (data.user.user_metadata ?? null) as Record<string, unknown> | null,
    );
  });

export const saveProfileStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input)
  .handler(async ({ data, context }) => {
    await assertConsent(context.userId);
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.saveProfileStep(context.userId, data);
  });

export const saveAddressStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input)
  .handler(async ({ data, context }) => {
    await assertConsent(context.userId);
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.saveAddressStep(context.userId, data);
  });

export const registerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input)
  .handler(async ({ data, context }) => {
    await assertConsent(context.userId);
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.registerDocument(context.userId, data);
  });

export const removeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertConsent(context.userId);
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.removeDocument(context.userId, data.documentId);
  });

export const getDocumentPreviewUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertConsent(context.userId);
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.createDocumentPreviewUrl(context.userId, data.documentId);
  });

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertConsent(context.userId);
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.submitForVerification(context.userId);
  });

export const changePendingPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ phone: internationalPhoneSchema }).parse(input))
  .handler(async ({ data, context }) => {
    await assertConsent(context.userId);
    const service = await import("@/features/onboarding/services/contact-verification.server");
    return service.changePendingPhone(context.userId, data.phone);
  });

export const sendContactVerificationCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertConsent(context.userId);
    const service = await import("@/features/onboarding/services/contact-verification.server");
    return service.sendContactVerificationCode(context.userId);
  });

export const verifyContactCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().regex(/^\\d{6}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertConsent(context.userId);
    const service = await import("@/features/onboarding/services/contact-verification.server");
    return service.verifyContactCode(context.userId, data.code);
  });
