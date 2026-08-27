import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CustomerContext } from "@/features/onboarding/types/customer-context";

export const getCustomerContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomerContext> => {
    const { loadCustomerContext } = await import(
      "@/features/onboarding/services/onboarding.server"
    );
    const claims = context.claims as { email?: string; email_verified?: boolean } | null;
    const { data } = await context.supabase.auth.getUser();
    const email = data.user?.email ?? claims?.email ?? null;
    const emailVerified = Boolean(data.user?.email_confirmed_at);
    return loadCustomerContext(context.userId, email, emailVerified);
  });

export const saveProfileStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input)
  .handler(async ({ data, context }) => {
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.saveProfileStep(context.userId, data);
  });

export const saveAddressStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input)
  .handler(async ({ data, context }) => {
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.saveAddressStep(context.userId, data);
  });

export const registerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input)
  .handler(async ({ data, context }) => {
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.registerDocument(context.userId, data);
  });

export const removeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentId: string }) => input)
  .handler(async ({ data, context }) => {
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.removeDocument(context.userId, data.documentId);
  });

export const getDocumentPreviewUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentId: string }) => input)
  .handler(async ({ data, context }) => {
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.createDocumentPreviewUrl(context.userId, data.documentId);
  });

export const submitVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const service = await import("@/features/onboarding/services/onboarding.server");
    return service.submitForVerification(context.userId);
  });
