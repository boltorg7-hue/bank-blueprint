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
import type { CustomerContext } from "@/features/onboarding/types/customer-context";

const PROFILE_COLUMNS =
  "id, first_name, middle_name, last_name, date_of_birth, nationality, country_of_residence, occupation, phone, phone_verified_at, lifecycle_state, onboarding_step";

export class OnboardingError extends Error {}

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
      .update({ lifecycle_state: "PROFILE_INCOMPLETE" })
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
  const { error } = await supabaseAdmin
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
      onboarding_step: "ADDRESS",
    })
    .eq("id", userId);
  if (error) throw new OnboardingError(error.message);
  return { ok: true as const };
}

export async function saveAddressStep(userId: string, input: unknown) {
  const data = addressStepSchema.parse(input);
  const payload = {
    user_id: userId,
    country: data.country,
    address_line1: data.addressLine1,
    address_line2: data.addressLine2 ? data.addressLine2 : null,
    city: data.city,
    region: data.region ? data.region : null,
    postal_code: data.postalCode ? data.postalCode : null,
    is_primary: true,
  };

  const { data: existing } = await supabaseAdmin
    .from("customer_addresses")
    .select("id")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  const { error } = existing
    ? await supabaseAdmin.from("customer_addresses").update(payload).eq("id", existing.id)
    : await supabaseAdmin.from("customer_addresses").insert(payload);
  if (error) throw new OnboardingError(error.message);

  await supabaseAdmin
    .from("profiles")
    .update({ onboarding_step: "IDENTITY" })
    .eq("id", userId)
    .in("onboarding_step", ["NOT_STARTED", "CONTACT", "PERSONAL_DETAILS", "ADDRESS"]);

  return { ok: true as const };
}

const EDITABLE_VERIFICATION_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "ADDITIONAL_INFORMATION_REQUIRED",
  "REJECTED",
] as const;


export async function registerDocument(userId: string, input: unknown) {
  const data = documentUploadSchema.parse(input);
  if (!data.storagePath.startsWith(`${userId}/`)) {
    throw new OnboardingError("Chemin de document invalide.");
  }

  const verification = await requireVerification(userId);
  if (!(EDITABLE_VERIFICATION_STATUSES as readonly string[]).includes(verification.status)) {
    throw new OnboardingError("Votre dossier est en cours de vérification.");
  }

  const { error } = await supabaseAdmin.from("verification_documents").insert({
    verification_id: verification.id,
    user_id: userId,
    document_type: data.documentType,
    storage_path: data.storagePath,
    original_filename: data.originalFilename,
    mime_type: data.mimeType,
    size_bytes: data.sizeBytes,
  });
  if (error) throw new OnboardingError(error.message);

  if (verification.status === "NOT_STARTED") {
    await supabaseAdmin
      .from("identity_verifications")
      .update({ status: "IN_PROGRESS" })
      .eq("id", verification.id);
  }
  await supabaseAdmin
    .from("profiles")
    .update({ onboarding_step: "DOCUMENTS" })
    .eq("id", userId)
    .in("onboarding_step", ["NOT_STARTED", "CONTACT", "PERSONAL_DETAILS", "ADDRESS", "IDENTITY"]);

  return { ok: true as const };
}

export async function removeDocument(userId: string, documentId: string) {
  const verification = await requireVerification(userId);
  if (!(EDITABLE_VERIFICATION_STATUSES as readonly string[]).includes(verification.status)) {
    throw new OnboardingError("Ce document ne peut plus être retiré.");
  }

  const { data: document } = await supabaseAdmin
    .from("verification_documents")
    .select("id, storage_path")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!document) throw new OnboardingError("Document introuvable.");

  await supabaseAdmin.storage.from("identity-documents").remove([document.storage_path]);
  const { error } = await supabaseAdmin
    .from("verification_documents")
    .delete()
    .eq("id", document.id);
  if (error) throw new OnboardingError(error.message);
  return { ok: true as const };
}

export async function createDocumentPreviewUrl(userId: string, documentId: string) {
  const { data: document } = await supabaseAdmin
    .from("verification_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!document) throw new OnboardingError("Document introuvable.");

  const { data, error } = await supabaseAdmin.storage
    .from("identity-documents")
    .createSignedUrl(document.storage_path, 60);
  if (error || !data) throw new OnboardingError("Aperçu indisponible.");
  return { url: data.signedUrl };
}

/** Idempotent, server-controlled submission (§50, §51). */
export async function submitForVerification(userId: string) {
  const verification = await requireVerification(userId);

  if (["SUBMITTED", "UNDER_REVIEW", "VERIFIED"].includes(verification.status)) {
    return { status: verification.status, alreadySubmitted: true as const };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select(
      "first_name, last_name, date_of_birth, nationality, country_of_residence, occupation, lifecycle_state",
    )
    .eq("id", userId)
    .single();

  if (
    !profile?.first_name ||
    !profile.last_name ||
    !profile.date_of_birth ||
    !profile.nationality ||
    !profile.country_of_residence ||
    !profile.occupation
  ) {
    throw new OnboardingError("Complétez vos informations personnelles avant l'envoi.");
  }

  const { data: address } = await supabaseAdmin
    .from("customer_addresses")
    .select("id")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();
  if (!address) throw new OnboardingError("Ajoutez votre adresse avant l'envoi.");

  const { data: documents } = await supabaseAdmin
    .from("verification_documents")
    .select("document_type")
    .eq("user_id", userId);

  const types = new Set((documents ?? []).map((document) => document.document_type));
  const hasIdentity =
    types.has("IDENTITY_CARD") || types.has("PASSPORT") || types.has("RESIDENCE_PERMIT");
  if (!hasIdentity) throw new OnboardingError("Ajoutez une pièce d'identité avant l'envoi.");
  if (!types.has("PROOF_OF_ADDRESS")) {
    throw new OnboardingError("Ajoutez un justificatif de domicile avant l'envoi.");
  }

  const submittedAt = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("identity_verifications")
    .update({
      status: "SUBMITTED",
      submitted_at: submittedAt,
      requested_information: null,
      decision_reason: null,
    })
    .eq("id", verification.id)
    .in("status", EDITABLE_VERIFICATION_STATUSES);
  if (error) throw new OnboardingError(error.message);

  await supabaseAdmin.from("verification_status_history").insert({
    verification_id: verification.id,
    user_id: userId,
    previous_status: verification.status,
    new_status: "SUBMITTED",
    changed_by: userId,
    note: "Dossier envoyé par le client.",
  });

  await supabaseAdmin
    .from("verification_documents")
    .update({ status: "UNDER_REVIEW" })
    .eq("user_id", userId)
    .eq("status", "UPLOADED");

  await supabaseAdmin
    .from("profiles")
    .update({ lifecycle_state: "IDENTITY_SUBMITTED", onboarding_step: "COMPLETED" })
    .eq("id", userId);

  return { status: "SUBMITTED" as const, alreadySubmitted: false as const };
}

async function requireVerification(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("identity_verifications")
    .select("id, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new OnboardingError(error.message);
  if (data) return data;

  const { data: created, error: insertError } = await supabaseAdmin
    .from("identity_verifications")
    .insert({ user_id: userId })
    .select("id, status")
    .single();
  if (insertError) throw new OnboardingError(insertError.message);
  return created;
}
