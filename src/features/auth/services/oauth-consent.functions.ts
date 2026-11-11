import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TERMS_VERSION = "2026-11-11";
const PRIVACY_VERSION = "2026-11-11";

export class OAuthConsentRequiredError extends Error {
  constructor() {
    super("OAUTH_CONSENT_REQUIRED");
    this.name = "OAuthConsentRequiredError";
  }
}

export async function assertCustomerConsent(userId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("terms_accepted_at, privacy_accepted_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.terms_accepted_at || !data.privacy_accepted_at) {
    throw new OAuthConsentRequiredError();
  }
}

export const getOAuthConsentStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userData, error: userError } = await context.supabase.auth.getUser();
    if (userError || !userData.user || userData.user.id !== context.userId) {
      throw new Error("UNAUTHORIZED");
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("terms_accepted_at, privacy_accepted_at")
      .eq("id", context.userId)
      .maybeSingle();

    if (error) throw new Error("CONSENT_STATUS_UNAVAILABLE");
    return {
      required: !data?.terms_accepted_at || !data.privacy_accepted_at,
      provider: userData.user.app_metadata?.provider ?? null,
    };
  });

export const recordOAuthConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      termsAccepted: z.literal(true),
      privacyAccepted: z.literal(true),
      marketingConsent: z.boolean(),
    }).strict().parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: userData, error: userError } = await context.supabase.auth.getUser();
    if (userError || !userData.user || userData.user.id !== context.userId) {
      throw new Error("UNAUTHORIZED");
    }

    const provider = userData.user.app_metadata?.provider;
    if (provider !== "google" && provider !== "apple") {
      throw new Error("UNSUPPORTED_OAUTH_PROVIDER");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("record_oauth_registration_consent", {
      _user_id: context.userId,
      _provider: provider,
      _terms_version: TERMS_VERSION,
      _privacy_version: PRIVACY_VERSION,
      _marketing_consent: data.marketingConsent,
    });

    if (error) throw new Error("CONSENT_RECORDING_FAILED");
    return { ok: true as const };
  });
