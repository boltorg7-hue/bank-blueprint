/**
 * Server-only onboarding logic (§50, §51, §57).
 *
 * Every lifecycle and verification transition happens here, under a verified
 * caller identity. The client can never declare itself verified or active.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  addressStepSchema,
  documentUploadSchema,
  profileStepSchema,
} from "@/features/onboarding/schemas/onboarding.schemas";
import type { CustomerContext } from "@/domain/onboarding/types";

const PROFILE_COLUMNS =
  "id, first_name, middle_name, last_name, date_of_birth, nationality, country_of_residence, occupation, phone, phone_verified_at, lifecycle_state, onboarding_step";

export class OnboardingError extends Error {}

const PROFILE_EDITABLE_LIFECYCLE_STATES = [
  "CONTACT_VERIFICATION_REQUIRED",
  "PROFILE_INCOMPLETE",
  "IDENTITY_REQUIRED",
] as const;

const ONBOARDING_EDITABLE_LIFECYCLE_STATES = [
  ...PROFILE_EDITABLE_LIFECYCLE_STATES,
  "ADDITIONAL_DOCUMENT_REQUIRED",
] as const;

async function requireEditableLifecycle(
  userId: string,
  allowedStates: readonly string[] = ONBOARDING_EDITABLE_LIFECYCLE_STATES,
) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("lifecycle_state")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new OnboardingError("CUSTOMER_STATE_UNAVAILABLE");
  if (!profile) throw new OnboardingError("CUSTOMER_PROFILE_NOT_FOUND");
  if (!allowedStates.includes(profile.lifecycle_state)) {
    throw new OnboardingError("ONBOARDING_STATE_LOCKED");
  }

  return profile.lifecycle_state as string;
}

export async function loadCustomerContext(
  userId: string,
  email: string | null,
  emailVerified: boolean,
): Promise<CustomerContext> {
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  let profile = existingProfile;
  if (!profile) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        lifecycle_state: emailVerified ? "PROFILE_INCOMPLETE" : "EMAIL_VERIFICATION_REQUIRED",
      })
      .select(PROFILE_COLUMNS)
      .single();
    if (error) throw new OnboardingError(error.message);
    profile = data;
  }

  // Keep the lifecycle consistent with the trusted authentication state.
  if (emailVerified && profile.lifecycle_state === "EMAIL_VERIFICATION_REQUIRED") {
    const { data } = await supabaseAdmin
      .from("profiles")
      .update({
        lifecycle_state:
          profile.phone && !profile.phone_verified_at
            ? "CONTACT_VERIFICATION_REQUIRED"
            : "PROFILE_INCOMPLETE",
      })
      .eq("id", userId)
      .select(PROFILE_COLUMNS)
      .single();
    if (data) profile = data;
  }

  let { data: verification } = await supabaseAdmin
    .from("identity_verifications")
    .select("id, status, submitted_at, decided_at, decision_reason, requested_information")
    .eq("user_id", userId)
    .maybeSingle();

  if (!verification) {
    const { data, error } = await supabaseAdmin
      .from("identity_verifications")
      .insert({ user_id: userId })
      .select("id, status, submitted_at, decided_at, decision_reason, requested_information")
      .single();
    if (error) throw new OnboardingError(error.message);
    verification = data;
  }

  const { data: address } = await supabaseAdmin
    .from("customer_addresses")
    .select("id, country, address_line1, address_line2, city, region, postal_code")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  const { data: documents } = await supabaseAdmin
    .from("verification_documents")
    .select("id, document_type, original_filename, status, rejection_reason, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return {
    email,
    emailVerified,
    profile,
    address: address ?? null,
    verification,
    documents: documents ?? [],
  } as CustomerContext;
}

export async function saveProfileStep(userId: string, input: unknown) {
  const data = profileStepSchema.parse(input);
  await requireEditableLifecycle(userId, PROFILE_EDITABLE_LIFECYCLE_STATES);

  const { data: updatedProfile, error } = await supabaseAdmin
    .from("profiles")
    .update({
      first_name: data.firstName,
      middle_name: data.middleName ? data.middleName : null,
      last_name: data.lastName,
      date_of_birth: data.dateOfBirth,
      nationality: data.nationality,
      country_of_residence: data.countryOfResidence,
      occupation: data.occupation,
      phone: data.phone ? data.phone : null,
      phone_verified_at: null,
      lifecycle_state: data.phone ? "CONTACT_VERIFICATION_REQUIRED" : "PROFILE_INCOMPLETE",
      onboarding_step: data.phone ? "CONTACT" : "ADDRESS",
    })
    .eq("id", userId)
    .in("lifecycle_state", PROFILE_EDITABLE_LIFECYCLE_STATES)
    .select("id")
    .maybeSingle();

  if (error) throw new OnboardingError(error.message);
  if (!updatedProfile) throw new OnboardingError("ONBOARDING_STATE_LOCKED");
  return { ok: true as const };
}

export async function saveAddressStep(userId: string, input: unknown) {
  const data = addressStepSchema.parse(input);
  const { error } = await supabaseAdmin.rpc(
    "customer_save_onboarding_address" as never,
    {
      _user_id: userId,
      _country: data.country,
      _address_line1: data.addressLine1,
      _address_line2: data.addressLine2 ? data.addressLine2 : null,
      _city: data.city,
      _region: data.region ? data.region : null,
      _postal_code: data.postalCode ? data.postalCode : null,
    } as never,
  );

  if (error) throw new OnboardingError(error.message);
  return { ok: true as const };
}

export async function registerDocument(userId: string, input: unknown) {
  const data = documentUploadSchema.parse(input);
  if (!data.storagePath.startsWith(`${userId}/`)) {
    throw new OnboardingError("Chemin de document invalide.");
  }

  const { error } = await supabaseAdmin.rpc(
    "customer_register_onboarding_document" as never,
    {
      _user_id: userId,
      _document_type: data.documentType,
      _storage_path: data.storagePath,
      _original_filename: data.originalFilename,
      _mime_type: data.mimeType,
      _size_bytes: data.sizeBytes,
    } as never,
  );

  if (error) throw new OnboardingError(error.message);
  return { ok: true as const };
}

export async function removeDocument(userId: string, documentId: string) {
  const { data: storagePath, error } = await supabaseAdmin.rpc(
    "customer_remove_onboarding_document" as never,
    { _user_id: userId, _document_id: documentId } as never,
  );

  if (error) throw new OnboardingError(error.message);
  if (typeof storagePath !== "string" || !storagePath) {
    throw new OnboardingError("DOCUMENT_NOT_FOUND");
  }

  const { error: storageError } = await supabaseAdmin.storage
    .from("identity-documents")
    .remove([storagePath]);
  if (storageError) throw new OnboardingError("DOCUMENT_STORAGE_DELETE_FAILED");

  return { ok: true as const };
}

export async function submitForVerification(userId: string) {
  const { data, error } = await supabaseAdmin.rpc(
    "customer_submit_onboarding_for_verification" as never,
    { _user_id: userId } as never,
  );

  if (error) throw new OnboardingError(error.message);
  const result = (
    data as unknown as Array<{
      status: "SUBMITTED" | "UNDER_REVIEW" | "VERIFIED";
      already_submitted: boolean;
    }> | null
  )?.[0];

  if (!result) throw new OnboardingError("PROCESSING_ERROR");
  return {
    status: result.status,
    alreadySubmitted: result.already_submitted,
  };
}
