/**
 * Server-only email confirmation controls.
 * - Each send (resend or address change) rotates a nonce: only the latest link is honoured.
 * - Sends are rate limited per address (60 s spacing, 5 per hour).
 */
import { createClient } from "@supabase/supabase-js";

export const RESEND_SPACING_SECONDS = 60;
export const MAX_SENDS_PER_HOUR = 5;

export type SendResult =
  | { ok: true; retryAfter: number; remaining: number }
  | { ok: false; code: "RATE_LIMITED" | "INVALID" | "ALREADY_VERIFIED" | "AUTH_FAILED" | "EMAIL_TAKEN" | "SEND_FAILED"; retryAfter?: number };

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function publicClient() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Auth configuration missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function checkQuota(email: string): Promise<{ allowed: boolean; retryAfter: number; remaining: number }> {
  const db = await admin();
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { data } = await db
    .from("email_confirmation_sends")
    .select("created_at")
    .eq("email", email)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  if (rows.length >= MAX_SENDS_PER_HOUR) {
    const oldest = new Date(rows[rows.length - 1]!.created_at).getTime();
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((oldest + 3600_000 - Date.now()) / 1000)), remaining: 0 };
  }
  if (rows[0]) {
    const elapsed = (Date.now() - new Date(rows[0].created_at).getTime()) / 1000;
    if (elapsed < RESEND_SPACING_SECONDS) {
      return { allowed: false, retryAfter: Math.ceil(RESEND_SPACING_SECONDS - elapsed), remaining: MAX_SENDS_PER_HOUR - rows.length };
    }
  }
  return { allowed: true, retryAfter: 0, remaining: MAX_SENDS_PER_HOUR - rows.length - 1 };
}

async function rotateNonce(email: string, userId: string | null): Promise<string> {
  const db = await admin();
  const nonce = crypto.randomUUID();
  await db.from("email_confirmation_links").upsert({ email, user_id: userId, current_nonce: nonce, updated_at: new Date().toISOString() });
  return nonce;
}

async function sendSignupLink(email: string, userId: string | null, origin: string, kind: string): Promise<SendResult> {
  const quota = await checkQuota(email);
  if (!quota.allowed) return { ok: false, code: "RATE_LIMITED", retryAfter: quota.retryAfter };
  const db = await admin();
  await db.from("email_confirmation_sends").insert({ email, kind });
  const nonce = await rotateNonce(email, userId);
  const { error } = await publicClient().auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=verified&v=${nonce}` },
  });
  if (error) {
    if (/rate|seconds|429/i.test(error.message)) return { ok: false, code: "RATE_LIMITED", retryAfter: RESEND_SPACING_SECONDS };
    return { ok: false, code: "SEND_FAILED" };
  }
  return { ok: true, retryAfter: RESEND_SPACING_SECONDS, remaining: quota.remaining };
}

async function lookupUser(email: string) {
  const db = await admin();
  const { data } = await db.rpc("auth_user_for_email", { _email: email });
  const row = Array.isArray(data) ? data[0] : null;
  return row as { id: string; email_confirmed_at: string | null } | null;
}

export async function resendConfirmation(emailRaw: string, origin: string): Promise<SendResult> {
  const email = emailRaw.trim().toLowerCase();
  const user = await lookupUser(email);
  if (user?.email_confirmed_at) return { ok: false, code: "ALREADY_VERIFIED" };
  // Unknown addresses get the same neutral answer (no account enumeration), but still count against quota.
  if (!user) {
    const quota = await checkQuota(email);
    if (!quota.allowed) return { ok: false, code: "RATE_LIMITED", retryAfter: quota.retryAfter };
    const db = await admin();
    await db.from("email_confirmation_sends").insert({ email, kind: "resend_unknown" });
    return { ok: true, retryAfter: RESEND_SPACING_SECONDS, remaining: quota.remaining };
  }
  return sendSignupLink(email, user.id, origin, "resend");
}

export async function changeUnverifiedEmail(
  input: { currentEmail: string; password: string; newEmail: string },
  origin: string,
): Promise<SendResult> {
  const currentEmail = input.currentEmail.trim().toLowerCase();
  const newEmail = input.newEmail.trim().toLowerCase();
  if (currentEmail === newEmail) return { ok: false, code: "INVALID" };

  // Proves ownership: GoTrue validates the password before reporting "email not confirmed".
  const { error: signInError } = await publicClient().auth.signInWithPassword({ email: currentEmail, password: input.password });
  if (signInError && !/not confirmed/i.test(signInError.message) && signInError.code !== "email_not_confirmed") {
    return { ok: false, code: "AUTH_FAILED" };
  }

  const user = await lookupUser(currentEmail);
  if (!user) return { ok: false, code: "AUTH_FAILED" };
  if (user.email_confirmed_at) return { ok: false, code: "ALREADY_VERIFIED" };
  if (await lookupUser(newEmail)) return { ok: false, code: "EMAIL_TAKEN" };

  const quota = await checkQuota(newEmail);
  if (!quota.allowed) return { ok: false, code: "RATE_LIMITED", retryAfter: quota.retryAfter };

  const db = await admin();
  const { error } = await db.auth.admin.updateUserById(user.id, { email: newEmail, email_confirm: false });
  if (error) return { ok: false, code: /already/i.test(error.message) ? "EMAIL_TAKEN" : "SEND_FAILED" };

  // Invalidate every link issued to the previous address.
  await db.from("email_confirmation_links").delete().eq("email", currentEmail);
  await db.from("email_confirmation_links").upsert({ email: currentEmail, user_id: null, current_nonce: crypto.randomUUID() });
  // A fresh signup link regenerates the confirmation token server-side, so old tokens stop working.
  return sendSignupLink(newEmail, user.id, origin, "change");
}

/** Called after a link is opened: true when the link is the latest one issued for this address. */
export async function isLatestConfirmationLink(email: string, nonce: string | undefined): Promise<boolean> {
  const db = await admin();
  const { data } = await db
    .from("email_confirmation_links")
    .select("current_nonce")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (!data) return true; // original sign-up link, never superseded
  return Boolean(nonce) && data.current_nonce === nonce;
}
