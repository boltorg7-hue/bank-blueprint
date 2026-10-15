import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function confirmationBaseUrl(): string {
  const configured = process.env["APP_BASE_URL"];
  if (!configured) {
    throw new Error("APP_BASE_URL must be configured to the official HTTPS bank origin.");
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("APP_BASE_URL must be a valid absolute URL.");
  }

  if (
    url.protocol !== "https:" ||
    !url.hostname ||
    url.username ||
    url.password ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    throw new Error("APP_BASE_URL must be an HTTPS origin without credentials, path, query, or fragment.");
  }

  return url.origin;
}

const email = z.string().trim().email().max(254);

export const resendConfirmationEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ email }).parse(input))
  .handler(async ({ data }) => {
    const { resendConfirmation } = await import("./email-confirmation.server");
    return resendConfirmation(data.email, confirmationBaseUrl());
  });

export const changePendingEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ currentEmail: email, newEmail: email, password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { changeUnverifiedEmail } = await import("./email-confirmation.server");
    return changeUnverifiedEmail(data, confirmationBaseUrl());
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
