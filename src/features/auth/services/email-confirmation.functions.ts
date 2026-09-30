import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function requestOrigin(): string {
  const origin = getRequestHeader("origin");
  if (origin && /^https?:\/\//.test(origin)) return origin;
  const host = getRequestHeader("host");
  return host ? `https://${host}` : "https://rfbank.lovable.app";
}

const email = z.string().trim().email().max(254);

export const resendConfirmationEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ email }).parse(input))
  .handler(async ({ data }) => {
    const { resendConfirmation } = await import("./email-confirmation.server");
    return resendConfirmation(data.email, requestOrigin());
  });

export const changePendingEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ currentEmail: email, newEmail: email, password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { changeUnverifiedEmail } = await import("./email-confirmation.server");
    return changeUnverifiedEmail(data, requestOrigin());
  });

export const checkConfirmationLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ nonce: z.string().max(64).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: userData } = await context.supabase.auth.getUser();
    const mail = userData.user?.email;
    if (!mail) return { valid: false };
    const { isLatestConfirmationLink } = await import("./email-confirmation.server");
    return { valid: await isLatestConfirmationLink(mail, data.nonce) };
  });
