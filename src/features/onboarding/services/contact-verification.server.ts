import { createHash, randomInt } from "node:crypto";
import { supabaseAdmin as typedAdmin } from "@/integrations/supabase/client.server";
import { internationalPhoneSchema } from "@/features/onboarding/schemas/onboarding.schemas";

const supabaseAdmin = typedAdmin as any;
const OTP_TTL_MINUTES = 10;

function otpHash(userId: string, phone: string, code: string) {
  const secret = process.env["PHONE_OTP_SECRET"]?.trim();
  if (!secret || secret.length < 32) throw new Error("OTP_SECRET_NOT_CONFIGURED");
  return createHash("sha256").update(`${secret}:${userId}:${phone}:${code}`).digest("hex");
}

function rpcError(error: { message?: string } | null, fallback: string): never {
  const message = error?.message ?? "";
  for (const code of [
    "OTP_COOLDOWN", "PHONE_REQUIRED", "PHONE_ALREADY_VERIFIED",
    "CUSTOMER_PROFILE_NOT_FOUND", "ONBOARDING_STATE_LOCKED", "PHONE_UNCHANGED",
    "INVALID_PHONE",
  ]) {
    if (message.includes(code)) throw new Error(code);
  }
  throw new Error(fallback);
}

export async function changePendingPhone(userId: string, phoneInput: unknown) {
  const phone = internationalPhoneSchema.parse(phoneInput);
  const { error } = await supabaseAdmin.rpc("customer_change_pending_phone", {
    _user_id: userId,
    _phone: phone,
  });
  if (error) rpcError(error, "PHONE_CHANGE_FAILED");
  return { ok: true as const, phone };
}

export async function sendContactVerificationCode(userId: string) {
  const secret = process.env["PHONE_OTP_SECRET"]?.trim();
  if (!secret || secret.length < 32) throw new Error("OTP_SECRET_NOT_CONFIGURED");

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("phone, phone_verified_at, lifecycle_state")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new Error("PROFILE_LOOKUP_FAILED");
  if (!profile) throw new Error("CUSTOMER_PROFILE_NOT_FOUND");
  if (!profile.phone) throw new Error("PHONE_REQUIRED");
  if (profile.phone_verified_at) return { alreadyVerified: true as const, phone: profile.phone };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();
  const { data, error } = await supabaseAdmin.rpc("customer_create_phone_verification", {
    _user_id: userId,
    _code_hash: otpHash(userId, profile.phone, code),
    _code: code,
    _expires_at: expiresAt,
  });
  if (error) rpcError(error, "OTP_CREATE_FAILED");
  const challenge = Array.isArray(data) ? data[0] : null;
  if (!challenge?.notification_id) throw new Error("SMS_QUEUE_FAILED");

  const invalidateFailedChallenge = async () => {
    const now = new Date().toISOString();
    const [{ error: challengeError }, { error: outboxError }] = await Promise.all([
      supabaseAdmin
        .from("phone_verification_codes")
        .update({ consumed_at: now })
        .eq("user_id", userId)
        .eq("phone", profile.phone)
        .is("consumed_at", null),
      supabaseAdmin
        .from("notification_outbox")
        .update({ status: "FAILED", processed_at: now, last_error_code: "SMS_DELIVERY_FAILED" })
        .eq("id", challenge.notification_id)
        .eq("user_id", userId)
        .eq("status", "PENDING"),
    ]);
    if (challengeError || outboxError) throw new Error("SMS_FAILURE_CLEANUP_FAILED");
  };

  const { dispatchPendingSms } = await import("@/features/notifications/services/notifications.server");
  try {
    await dispatchPendingSms(userId);
  } catch {
    await invalidateFailedChallenge();
    throw new Error("SMS_DELIVERY_FAILED");
  }

  const { data: notification, error: notificationError } = await supabaseAdmin
    .from("notification_outbox")
    .select("status")
    .eq("id", challenge.notification_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (notificationError) {
    await invalidateFailedChallenge();
    throw new Error("SMS_STATUS_UNAVAILABLE");
  }
  if (notification?.status !== "SENT") {
    await invalidateFailedChallenge();
    throw new Error(notification?.status === "SIMULATED" ? "SMS_SIMULATED_NOT_DELIVERED" : "SMS_DELIVERY_FAILED");
  }

  return { alreadyVerified: false as const, phone: profile.phone, expiresAt };
}

export async function verifyContactCode(userId: string, codeInput: unknown) {
  const code = String(codeInput ?? "").trim();
  if (!/^\d{6}$/.test(code)) throw new Error("INVALID_OTP");

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("phone, phone_verified_at")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new Error("PROFILE_LOOKUP_FAILED");
  if (!profile?.phone) throw new Error("PHONE_REQUIRED");
  if (profile.phone_verified_at) return { ok: true as const, alreadyVerified: true as const };

  const { data, error } = await supabaseAdmin.rpc("customer_verify_phone_code", {
    _user_id: userId,
    _phone: profile.phone,
    _code_hash: otpHash(userId, profile.phone, code),
  });
  if (error) throw new Error("CONTACT_VERIFICATION_FAILED");
  const result = String(data ?? "");
  if (result === "OK" || result === "ALREADY_VERIFIED") {
    return { ok: true as const, alreadyVerified: result === "ALREADY_VERIFIED" };
  }
  throw new Error(result || "CONTACT_VERIFICATION_FAILED");
}
