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
  MAX_DOCUMENT_BYTES,
  profileStepSchema,
} from "@/features/onboarding/schemas/onboarding.schemas";
import type { CustomerContext } from "@/domain/onboarding/types";
import { assertCustomerConsent } from "@/features/auth/services/oauth-consent.server";

const PROFILE_COLUMNS =
  "id, first_name, middle_name, last_name, date_of_birth, nationality, country_of_residence, occupation, phone, phone_verified_at, lifecycle_state, onboarding_step";

export class OnboardingError extends Error {}

function detectDocumentMimeType(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));

  if (ascii(0, 5) === "%PDF-") return "application/pdf";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    ascii(1, 4) === "PNG" &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    return "image/webp";
  }
  if (
    bytes.length >= 12 &&
    ascii(4, 8) === "ftyp" &&
    ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(ascii(8, 12))
  ) {
    return "image/heic";
  }
  return null;
}

async function validateUploadedDocument(
  userId: string,
  data: { storagePath: string; mimeType: string; sizeBytes: number },
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new OnboardingError("INVALID_DOCUMENT_PATH");
  }
  const pathPattern = new RegExp(
    "^" +
      userId +
      "/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|jpeg|png|heic|webp|pdf)$",
    "i",
  );
  if (!pathPattern.test(data.storagePath)) {
    throw new OnboardingError("INVALID_DOCUMENT_PATH");
  }

  const { data: file, error } = await supabaseAdmin.storage
    .from("identity-documents")
    .download(data.storagePath);
  if (error || !file) throw new OnboardingError("DOCUMENT_OBJECT_NOT_FOUND");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const actualMimeType = detectDocumentMimeType(bytes);
  if (
    !actualMimeType ||
    actualMimeType !== data.mimeType ||
    bytes.byteLength !== data.sizeBytes ||
    bytes.byteLength < 1 ||
    bytes.byteLength > MAX_DOCUMENT_BYTES
  ) {
    await supabaseAdmin.storage.from("identity-documents").remove([data.storagePath]);
    throw new OnboardingError("INVALID_DOCUMENT_CONTENT");
  }

  const extensionByMime: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/heic": ["heic"],
    "image/webp": ["webp"],
    "application/pdf": ["pdf"],
  };
  const extension = data.storagePath.split(".").pop()?.toLowerCase() ?? "";
  if (!extensionByMime[actualMimeType]?.includes(extension)) {
    await supabaseAdmin.storage.from("identity-documents").remove([data.storagePath]);
    throw new OnboardingError("DOCUMENT_EXTENSION_MISMATCH");
  }
}

const PROFILE_EDITABLE_LIFECYCLE_STATES = [
  "CONTACT_VERIFICATION_REQUIRED",
  "PROFILE_INCOMPLETE",
  "IDENTITY_REQUIRED",
] as const;

const ONBOARDING_EDITABLE_LIFECYCLE_STATES = [
  ...PROFILE_EDITABLE_LIFECYCLE_STATES,
  "ADDITIONAL_DOCUMENT_REQUIRED",
] as const;

function metadataName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length >= 2 && normalized.length <= 60 ? normalized : null;
}

function profileNameHints(metadata: Record<string, unknown> | null | undefined) {
  const source = metadata ?? {};
  const fullName = metadataName(source["full_name"] ?? source["name"]);
  const parts = fullName?.split(" ") ?? [];
  return {
    first_name:
      metadataName(source["first_name"]) ??
      metadataName(source["given_name"]) ??
      (parts.length > 1 ? parts[0] : null),
    last_name:
      metadataName(source["last_name"]) ??
      metadataName(source["family_name"]) ??
      (parts.length > 1 ? parts.slice(1).join(" ") : null),
  };
}

async function requireEditableLifecycle(
  userId: string,
  allowedStates: readonly string[] = ONBOARDING_EDITABLE_LIFECYCLE_STATES,
) {
  await assertCustomerConsent(userId);
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
  authMetadata?: Record<string, unknown> | null,
): Promise<CustomerContext> {
  const { data: existingProfile, error: profileReadError } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (profileReadError) throw new OnboardingError("CUSTOMER_PROFILE_UNAVAILABLE");

  const nameHints = profileNameHints(authMetadata);
  let profile = existingProfile;
  if (!profile) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        first_name: nameHints.first_name ?? null,
        last_name: nameHints.last_name ?? null,
        lifecycle_state: emailVerified ? "PROFILE_INCOMPLETE" : "EMAIL_VERIFICATION_REQUIRED",
      })
      .select(PROFILE_COLUMNS)
      .single();
    if (error) throw new OnboardingError("CUSTOMER_PROFILE_CREATE_FAILED");
    profile = data;
  } else {
    // Provider names are suggestions only. Never overwrite details already
    // entered or verified by the customer.
    const missingNameHints = {
      ...(profile.first_name ? {} : { first_name: nameHints.first_name }),
      ...(profile.last_name ? {} : { last_name: nameHints.last_name }),
    };
    if (Object.values(missingNameHints).some(Boolean)) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(missingNameHints)
        .eq("id", userId)
        .select(PROFILE_COLUMNS)
        .single();
      if (error) throw new OnboardingError("CUSTOMER_PROFILE_PREFILL_FAILED");
      profile = data;
    }
  }

  // Keep the lifecycle consistent with the trusted authentication state.
  if (emailVerified && profile.lifecycle_state === "EMAIL_VERIFICATION_REQUIRED") {
    const { data, error } = await supabaseAdmin
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
    if (error || !data) throw new OnboardingError("CUSTOMER_LIFECYCLE_SYNC_FAILED");
    profile = data;
  }

  const { data: existingVerification, error: verificationReadError } = await supabaseAdmin
    .from("identity_verifications")
    .select("id, status, submitted_at, decided_at, decision_reason, requested_information")
    .eq("user_id", userId)
    .maybeSingle();

  if (verificationReadError) throw new OnboardingError("IDENTITY_STATUS_UNAVAILABLE");

  let verification = existingVerification;
  if (!verification) {
    const { data, error } = await supabaseAdmin
      .from("identity_verifications")
      .insert({ user_id: userId })
      .select("id, status, submitted_at, decided_at, decision_reason, requested_information")
      .single();
    if (error) throw new OnboardingError(error.message);
    verification = data;
  }

  const { data: address, error: addressError } = await supabaseAdmin
    .from("customer_addresses")
    .select("id, country, address_line1, address_line2, city, region, postal_code")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  if (addressError) throw new OnboardingError("CUSTOMER_ADDRESS_UNAVAILABLE");

  const { data: documents, error: documentsError } = await supabaseAdmin
    .from("verification_documents")
    .select("id, document_type, original_filename, status, rejection_reason, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (documentsError) throw new OnboardingError("CUSTOMER_DOCUMENTS_UNAVAILABLE");

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

  const { data: currentProfile, error: currentProfileError } = await supabaseAdmin
    .from("profiles")
    .select("phone, phone_verified_at, lifecycle_state, onboarding_step")
    .eq("id", userId)
    .maybeSingle();

  if (currentProfileError) throw new OnboardingError("CUSTOMER_PROFILE_UNAVAILABLE");
  if (!currentProfile) throw new OnboardingError("CUSTOMER_PROFILE_NOT_FOUND");

  const phoneUnchanged = currentProfile.phone === data.phone;
  if (!phoneUnchanged) {
    // Phone changes must use the same atomic path as the dedicated contact page:
    // invalidate old challenges, preserve lifecycle progression and check ownership.
    const { error: phoneChangeError } = await (supabaseAdmin.rpc as any)("customer_change_pending_phone", {
      _user_id: userId,
      _phone: data.phone,
    });
    if (phoneChangeError) {
      throw new OnboardingError(
        phoneChangeError.message?.includes("PHONE_ALREADY_IN_USE")
          ? "PHONE_ALREADY_IN_USE"
          : phoneChangeError.message?.includes("ONBOARDING_STATE_LOCKED")
            ? "ONBOARDING_STATE_LOCKED"
            : "PHONE_CHANGE_FAILED",
      );
    }
  }

  const contactVerified = phoneUnchanged && Boolean(currentProfile.phone_verified_at);
  // Preserve later review states when a customer edits personal details.
  const lifecycleState = contactVerified
    ? currentProfile.lifecycle_state === "CONTACT_VERIFICATION_REQUIRED"
      ? "PROFILE_INCOMPLETE"
      : currentProfile.lifecycle_state
    : currentProfile.lifecycle_state === "CONTACT_VERIFICATION_REQUIRED"
      ? "CONTACT_VERIFICATION_REQUIRED"
      : currentProfile.lifecycle_state;
  const onboardingStep = phoneUnchanged
    ? contactVerified
      ? ["CONTACT", "PERSONAL_DETAILS"].includes(currentProfile.onboarding_step)
        ? "ADDRESS"
        : currentProfile.onboarding_step
      : "CONTACT"
    : currentProfile.onboarding_step;

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
      ...(phoneUnchanged
        ? { lifecycle_state: lifecycleState, onboarding_step: onboardingStep }
        : {}),
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
  await assertCustomerConsent(userId);
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
  await assertCustomerConsent(userId);
  const data = documentUploadSchema.parse(input);
  await validateUploadedDocument(userId, data);

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

  if (error) {
    await supabaseAdmin.storage.from("identity-documents").remove([data.storagePath]);
    throw new OnboardingError(error.message);
  }
  return { ok: true as const };
}

export async function removeDocument(userId: string, documentId: string) {
  await assertCustomerConsent(userId);
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

export async function createDocumentPreviewUrl(userId: string, documentId: string) {
  await assertCustomerConsent(userId);
  const { data: document, error } = await supabaseAdmin
    .from("verification_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !document?.storage_path?.startsWith(`${userId}/`)) {
    throw new OnboardingError("DOCUMENT_NOT_FOUND");
  }

  const { data, error: signingError } = await supabaseAdmin.storage
    .from("identity-documents")
    .createSignedUrl(document.storage_path, 60);
  if (signingError || !data?.signedUrl) {
    throw new OnboardingError("DOCUMENT_PREVIEW_UNAVAILABLE");
  }

  return { url: data.signedUrl, expiresInSeconds: 60 };
}

export async function submitForVerification(userId: string) {
  await assertCustomerConsent(userId);
  const { data, error } = await supabaseAdmin.rpc(
    "customer_submit_onboarding_for_verification" as never,
    { _user_id: userId } as never,
  );

  if (error) throw new OnboardingError(error.message);
  const result = (
    data as unknown as Array<{
      status:
        | "NOT_STARTED"
        | "IN_PROGRESS"
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "ADDITIONAL_INFORMATION_REQUIRED"
        | "VERIFIED"
        | "REJECTED"
        | "EXPIRED";
      already_submitted: boolean;
    }> | null
  )?.[0];

  if (!result) throw new OnboardingError("PROCESSING_ERROR");
  return {
    status: result.status,
    alreadySubmitted: result.already_submitted,
  };
}
