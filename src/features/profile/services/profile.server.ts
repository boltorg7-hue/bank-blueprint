import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { permanentAddressSchema, permanentProfileSchema, preferencesSchema } from "@/features/profile/schemas/profile.schemas";
import type { CustomerPreferencesDto, ProfileOverviewDto } from "@/features/profile/types/profile";

const admin = supabaseAdmin as any;
export class ProfileError extends Error {}

export async function loadProfile(userId: string, email: string | null, emailVerified: boolean): Promise<ProfileOverviewDto> {
  const [{ data: profile, error }, { data: address }, { data: verification }, { data: accounts }] = await Promise.all([
    admin.from("profiles").select("first_name,middle_name,last_name,date_of_birth,nationality,country_of_residence,occupation,phone,phone_verified_at,lifecycle_state").eq("id", userId).single(),
    admin.from("customer_addresses").select("country,address_line1,address_line2,city,region,postal_code").eq("user_id", userId).eq("is_primary", true).maybeSingle(),
    admin.from("identity_verifications").select("status").eq("user_id", userId).maybeSingle(),
    admin.from("bank_accounts").select("public_reference,display_name,currency,status,account_number,iban,bic").eq("user_id", userId).order("is_primary", { ascending: false }),
  ]);
  if (error || !profile) throw new ProfileError("PROFILE_UNAVAILABLE");
  const identityStatus = verification?.status ?? "NOT_STARTED";
  return {
    email, emailVerified,
    firstName: profile.first_name ?? "", middleName: profile.middle_name ?? "", lastName: profile.last_name ?? "",
    dateOfBirth: profile.date_of_birth ?? "", nationality: profile.nationality ?? "",
    countryOfResidence: profile.country_of_residence ?? "", occupation: profile.occupation ?? "", phone: profile.phone ?? "",
    phoneVerified: Boolean(profile.phone_verified_at), lifecycleState: profile.lifecycle_state,
    identityStatus, identityLocked: ["SUBMITTED", "UNDER_REVIEW", "VERIFIED"].includes(identityStatus),
    address: { country: address?.country ?? "", addressLine1: address?.address_line1 ?? "", addressLine2: address?.address_line2 ?? "", city: address?.city ?? "", region: address?.region ?? "", postalCode: address?.postal_code ?? "" },
    accounts: (accounts ?? []).map((account: any) => ({ reference: account.public_reference, displayName: account.display_name, currency: account.currency, status: account.status, maskedNumber: `•••• ${String(account.account_number).slice(-4)}`, iban: account.iban ?? null, bic: account.bic ?? null })),
  };
}

export async function updateProfile(userId: string, input: unknown) {
  const data = permanentProfileSchema.parse(input);
  const { data: verification } = await admin.from("identity_verifications").select("status").eq("user_id", userId).maybeSingle();
  const locked = ["SUBMITTED", "UNDER_REVIEW", "VERIFIED"].includes(verification?.status ?? "");
  const payload: Record<string, unknown> = {
    country_of_residence: data.countryOfResidence, occupation: data.occupation, phone: data.phone || null,
  };
  if (!locked) Object.assign(payload, { first_name: data.firstName, middle_name: data.middleName || null, last_name: data.lastName, date_of_birth: data.dateOfBirth, nationality: data.nationality });
  const { error } = await admin.from("profiles").update(payload).eq("id", userId);
  if (error) throw new ProfileError("PROFILE_UPDATE_FAILED");
  return { ok: true, identityLocked: locked };
}

export async function updateAddress(userId: string, input: unknown) {
  const data = permanentAddressSchema.parse(input);
  const payload = { user_id: userId, country: data.country, address_line1: data.addressLine1, address_line2: data.addressLine2 || null, city: data.city, region: data.region || null, postal_code: data.postalCode || null, is_primary: true };
  const { data: current } = await admin.from("customer_addresses").select("id").eq("user_id", userId).eq("is_primary", true).maybeSingle();
  const { error } = current ? await admin.from("customer_addresses").update(payload).eq("id", current.id) : await admin.from("customer_addresses").insert(payload);
  if (error) throw new ProfileError("ADDRESS_UPDATE_FAILED");
  return { ok: true };
}

export async function loadPreferences(userId: string): Promise<CustomerPreferencesDto> {
  const { data } = await admin.from("customer_preferences").select("language,theme,privacy_mode_default,sms_transactions,sms_security,email_service").eq("user_id", userId).maybeSingle();
  return { language: data?.language ?? "fr", theme: data?.theme ?? "system", privacyModeDefault: data?.privacy_mode_default ?? false, smsTransactions: data?.sms_transactions ?? true, smsSecurity: data?.sms_security ?? true, emailService: data?.email_service ?? true };
}

export async function updatePreferences(userId: string, input: unknown): Promise<CustomerPreferencesDto> {
  const data = preferencesSchema.parse(input);
  const payload = { user_id: userId, language: data.language, theme: data.theme, privacy_mode_default: data.privacyModeDefault, sms_transactions: data.smsTransactions, sms_security: data.smsSecurity, email_service: data.emailService };
  const { error } = await admin.from("customer_preferences").upsert(payload, { onConflict: "user_id" });
  if (error) throw new ProfileError("PREFERENCES_UPDATE_FAILED");
  return data;
}
