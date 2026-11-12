import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { areOAuthConsentDocumentsPublished, PRIVACY_DOCUMENT, TERMS_DOCUMENT } from "@/features/public/content/legal";

type AuthClaims = {
  sub?: string;
  app_metadata?: {
    provider?: string;
  };
};

export const getOAuthConsentStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const claims = context.claims as AuthClaims | null;

    if (!claims?.sub || claims.sub !== context.userId) {
      throw new Error("UNAUTHORIZED");
    }

    const provider = claims.app_metadata?.provider ?? null;
    if (provider !== "google" && provider !== "apple") {
      return { required: false, provider, documentsPublished: areOAuthConsentDocumentsPublished() };
    }

    const documentsPublished = areOAuthConsentDocumentsPublished();

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("terms_accepted_at, privacy_accepted_at")
      .eq("id", context.userId)
      .maybeSingle();

    if (error) throw new Error("CONSENT_STATUS_UNAVAILABLE");

    return {
      required: !documentsPublished || !data?.terms_accepted_at || !data.privacy_accepted_at,
      provider,
      documentsPublished,
    };
  });

export const recordOAuthConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        termsAccepted: z.literal(true),
        privacyAccepted: z.literal(true),
        marketingConsent: z.boolean(),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const claims = context.claims as AuthClaims | null;

    if (!claims?.sub || claims.sub !== context.userId) {
      throw new Error("UNAUTHORIZED");
    }

    const provider = claims.app_metadata?.provider;
    if (provider !== "google" && provider !== "apple") {
      throw new Error("UNSUPPORTED_OAUTH_PROVIDER");
    }

    if (!areOAuthConsentDocumentsPublished() || !TERMS_DOCUMENT.lastUpdated || !PRIVACY_DOCUMENT.lastUpdated) {
      throw new Error("LEGAL_DOCUMENTS_NOT_PUBLISHED");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc(
      "record_oauth_registration_consent" as never,
      {
        _user_id: context.userId,
        _provider: provider,
        _terms_version: TERMS_DOCUMENT.lastUpdated,
        _privacy_version: PRIVACY_DOCUMENT.lastUpdated,
        _marketing_consent: data.marketingConsent,
      } as never,
    );

    if (error) throw new Error("CONSENT_RECORDING_FAILED");
    return { ok: true as const };
  });
