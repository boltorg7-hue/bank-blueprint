import { createHash, randomInt } from "node:crypto";
import { supabaseAdmin as typedAdmin } from "@/integrations/supabase/client.server";

// Contact-verification tables are not yet in the generated types.
const supabaseAdmin = typedAdmin as any;
import { profileStepSchema } from "@/features/onboarding/schemas/onboarding.schemas";

const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

function otpHash(userId: string, phone: string, code: string) {
  const secret = process.env["PHONE_OTP_SECRET"] || process.env["SUPABASE_SERVICE_ROLE_KEY"] || "development-only-secret";
  return createHash("sha256").update(`${secret}:${userId}:${phone}:${code}`).digest("hex");
}

export async function sendContactVerificationCode(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("phone, phone_verified_at, lifecycle_state")
    .eq("id", userId)
    .single();
  if (error || !profile) throw new Error("PROFILE_NOT_FOUND");
  if (!profile.phone) throw new Error("PHONE_REQUIRED");
  if (profile.phone_verified_at) return { alreadyVerified: true as const, phone: profile.phone };

  const { data: recent } = await supabaseAdmin
    .from("phone_verification_codes")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    throw new Error("OTP_COOLDOWN");
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

  await supabaseAdmin
    .from("phone_verification_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("consumed_at", null);

  const { error: insertError } = await supabaseAdmin.from("phone_verification_codes").insert({
    user_id: userId,
    phone: profile.phone,
    code_hash: otpHash(userId, profile.phone, code),
    expires_at: expiresAt,
    attempts: 0,
  });
  if (insertError) throw new Error("OTP_CREATE_FAILED");

  const { error: outboxError } = await supabaseAdmin.from("notification_outbox").insert({
    user_id: userId,
    channel: "SMS",
    recipient: profile.phone,
    template_key: "CONTACT_VERIFICATION_CODE",
    payload: { code, expires_in_minutes: OTP_TTL_MINUTES },
    status: "PENDING",
  });
  if (outboxError) throw new Error("SMS_QUEUE_FAILED");

  const { dispatchPendingSms } = await import("@/features/notifications/services/notifications.server");
  await dispatchPendingSms(userId);

  return { alreadyVerified: false as const, phone: profile.phone, expiresAt };
}

export async function verifyContactCode(userId: string, codeInput: unknown) {
  const code = String(codeInput ?? "").trim();
  if (!/^\d{6}$/.test(code)) throw new Error("INVALID_OTP");

  const { data: profile } = await supabaseAdmin.from("profiles").select("phone, phone_verified_at, lifecycle_state").eq("id", userId).single();
  if (!profile?.phone) throw new Error("PHONE_REQUIRED");
  if (profile.phone_verified_at) return { ok: true as const, alreadyVerified: true as const };

  const { data: row } = await supabaseAdmin
    .from("phone_verification_codes")
    .select("id, code_hash, expires_at, attempts, consumed_at")
    .eq("user_id", userId)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) throw new Error("OTP_NOT_FOUND");
  if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("OTP_EXPIRED");
  if (row.attempts >= MAX_ATTEMPTS) throw new Error("OTP_LOCKED");

  const valid = otpHash(userId, profile.phone, code) === row.code_hash;
  if (!valid) {
    await supabaseAdmin.from("phone_verification_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    throw new Error("OTP_INVALID");
  }

  const verifiedAt = new Date().toISOString();
  const { error } = await supabaseAdmin.from("profiles").update({
    phone_verified_at: verifiedAt,
    lifecycle_state: profile.lifecycle_state === "CONTACT_VERIFICATION_REQUIRED" ? "PROFILE_INCOMPLETE" : profile.lifecycle_state,
  }).eq("id", userId);
  if (error) throw new Error("CONTACT_VERIFICATION_FAILED");

  await supabaseAdmin.from("phone_verification_codes").update({ consumed_at: verifiedAt }).eq("id", row.id);
  return { ok: true as const, alreadyVerified: false as const };
}
