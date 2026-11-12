import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  permanentAddressSchema,
  permanentProfileSchema,
  preferencesSchema,
} from "@/features/profile/schemas/profile.schemas";
import type { CustomerPreferencesDto, ProfileOverviewDto } from "@/features/profile/types/profile";

const admin = supabaseAdmin;

export class ProfileError extends Error {}

export async function loadProfile(
  userId: string,
  email: string | null,
  emailVerified: boolean,
): Promise<ProfileOverviewDto> {
  const [{ data: profile, error }, { data: address }, { data: verification }, { data: accounts }] =
    await Promise.all([
      admin
        .from("profiles")
        .select(
          "first_name,middle_name,last_name,date_of_birth,nationality,country_of_residence,occupation,phone,phone_verified_at,lifecycle_state,avatar_storage_path",
        )
        .eq("id", userId)
        .single(),
      admin
        .from("customer_addresses")
        .select("country,address_line1,address_line2,city,region,postal_code")
        .eq("user_id", userId)
        .eq("is_primary", true)
        .maybeSingle(),
      admin.from("identity_verifications").select("status").eq("user_id", userId).maybeSingle(),
      admin
        .from("bank_accounts")
        .select("public_reference,display_name,currency,status,account_number,iban,bic")
        .eq("user_id", userId)
        .order("is_primary", { ascending: false }),
    ]);

  if (error || !profile) throw new ProfileError("PROFILE_UNAVAILABLE");

  const identityStatus = verification?.status ?? "NOT_STARTED";
  let avatarUrl: string | null = null;

  if (profile.avatar_storage_path) {
    const { data: signedAvatar } = await admin.storage
      .from("customer-avatars")
      .createSignedUrl(profile.avatar_storage_path, 900);
    avatarUrl = signedAvatar?.signedUrl ?? null;
  }

  return {
    email,
    emailVerified,
    avatarUrl,
    firstName: profile.first_name ?? "",
    middleName: profile.middle_name ?? "",
    lastName: profile.last_name ?? "",
    dateOfBirth: profile.date_of_birth ?? "",
    nationality: profile.nationality ?? "",
    countryOfResidence: profile.country_of_residence ?? "",
    occupation: profile.occupation ?? "",
    phone: profile.phone ?? "",
    phoneVerified: Boolean(profile.phone_verified_at),
    lifecycleState: profile.lifecycle_state,
    identityStatus,
    identityLocked: ["SUBMITTED", "UNDER_REVIEW", "VERIFIED"].includes(identityStatus),
    address: {
      country: address?.country ?? "",
      addressLine1: address?.address_line1 ?? "",
      addressLine2: address?.address_line2 ?? "",
      city: address?.city ?? "",
      region: address?.region ?? "",
      postalCode: address?.postal_code ?? "",
    },
    accounts: (accounts ?? []).map((account) => ({
      reference: account.public_reference,
      displayName: account.display_name,
      currency: account.currency,
      status: account.status,
      maskedNumber: `•••• ${String(account.account_number).slice(-4)}`,
      iban: account.iban ?? null,
      bic: account.bic ?? null,
    })),
  };
}

export async function updateProfile(userId: string, input: unknown) {
  const data = permanentProfileSchema.parse(input);
  const { data: verification } = await admin
    .from("identity_verifications")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  const locked = ["SUBMITTED", "UNDER_REVIEW", "VERIFIED"].includes(verification?.status ?? "");
  const payload: Record<string, unknown> = {
    country_of_residence: data.countryOfResidence,
    occupation: data.occupation,
    phone: data.phone || null,
  };

  if (!locked) {
    Object.assign(payload, {
      first_name: data.firstName,
      middle_name: data.middleName || null,
      last_name: data.lastName,
      date_of_birth: data.dateOfBirth,
      nationality: data.nationality,
    });
  }

  const { error } = await admin.from("profiles").update(payload).eq("id", userId);
  if (error) throw new ProfileError("PROFILE_UPDATE_FAILED");
  return { ok: true, identityLocked: locked };
}

export async function updateAddress(userId: string, input: unknown) {
  const data = permanentAddressSchema.parse(input);
  const payload = {
    user_id: userId,
    country: data.country,
    address_line1: data.addressLine1,
    address_line2: data.addressLine2 || null,
    city: data.city,
    region: data.region || null,
    postal_code: data.postalCode || null,
    is_primary: true,
  };
  const { data: current } = await admin
    .from("customer_addresses")
    .select("id")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();
  const { error } = current
    ? await admin.from("customer_addresses").update(payload).eq("id", current.id)
    : await admin.from("customer_addresses").insert(payload);

  if (error) throw new ProfileError("ADDRESS_UPDATE_FAILED");
  return { ok: true };
}

export async function updateProfileAvatar(userId: string, storagePath: unknown) {
  if (typeof storagePath !== "string") {
    throw new ProfileError("AVATAR_PATH_FORBIDDEN");
  }

  const [owner, filename, ...extra] = storagePath.split("/");
  if (
    owner !== userId ||
    extra.length !== 0 ||
    !/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(filename ?? "")
  ) {
    throw new ProfileError("AVATAR_PATH_FORBIDDEN");
  }

  const { data: image, error: downloadError } = await admin.storage
    .from("customer-avatars")
    .download(storagePath);

  if (downloadError || !image || image.size < 1 || image.size > 3145728) {
    throw new ProfileError("AVATAR_INVALID_CONTENT");
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";

  if (!isJpeg && !isPng && !isWebp) {
    throw new ProfileError("AVATAR_INVALID_CONTENT");
  }

  const { data: signedAvatar, error: signedError } = await admin.storage
    .from("customer-avatars")
    .createSignedUrl(storagePath, 900);

  if (signedError || !signedAvatar?.signedUrl) {
    throw new ProfileError("AVATAR_URL_UNAVAILABLE");
  }

  const { data: current } = await admin
    .from("profiles")
    .select("avatar_storage_path")
    .eq("id", userId)
    .single();
  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_storage_path: storagePath })
    .eq("id", userId);

  if (updateError) throw new ProfileError("AVATAR_SAVE_FAILED");

  const previousPath = current?.avatar_storage_path;
  if (previousPath && previousPath !== storagePath) {
    await admin.storage.from("customer-avatars").remove([previousPath]);
  }

  return { avatarUrl: signedAvatar.signedUrl };
}

export async function loadPreferences(userId: string): Promise<CustomerPreferencesDto> {
  const { data } = await admin
    .from("customer_preferences")
    .select("language,theme,privacy_mode_default,sms_transactions,sms_security,email_service")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    language: data?.language ?? "fr",
    theme: data?.theme ?? "system",
    privacyModeDefault: data?.privacy_mode_default ?? false,
    smsTransactions: data?.sms_transactions ?? true,
    smsSecurity: data?.sms_security ?? true,
    emailService: data?.email_service ?? true,
  };
}

export async function updatePreferences(
  userId: string,
  input: unknown,
): Promise<CustomerPreferencesDto> {
  const data = preferencesSchema.parse(input);
  const payload = {
    user_id: userId,
    language: data.language,
    theme: data.theme,
    privacy_mode_default: data.privacyModeDefault,
    sms_transactions: data.smsTransactions,
    sms_security: data.smsSecurity,
    email_service: data.emailService,
  };
  const { error } = await admin
    .from("customer_preferences")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw new ProfileError("PREFERENCES_UPDATE_FAILED");
  return data;
}
