import { createClient } from "@supabase/supabase-js";

import type { RegisterInput } from "@/features/auth/schemas/auth.schemas";

function registrationRedirectUrl(): string {
  const configured = process.env["APP_BASE_URL"] ?? "https://rfbank.lovable.app";
  let url: URL;

  try {
    url = new URL(configured);
  } catch {
    throw new Error("Registration origin is invalid.");
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
    throw new Error("Registration origin must be an HTTPS origin.");
  }

  return `${url.origin}/auth/callback?next=verified`;
}

export async function createCustomerRegistration(input: RegisterInput) {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error("Registration service is not configured.");
  }

  // Use only the publishable key. Account creation must never require service-role access.
  const authClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await authClient.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      emailRedirectTo: registrationRedirectUrl(),
      data: {
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        terms_accepted: "true",
        marketing_consent: input.marketing ? "true" : "false",
      },
    },
  });

  if (error) {
    return {
      ok: false as const,
      code: typeof error.code === "string" ? error.code : "SIGNUP_FAILED",
    };
  }

  return {
    ok: true as const,
    email: data.user?.email ?? input.email.trim().toLowerCase(),
    session: data.session
      ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }
      : null,
  };
}
