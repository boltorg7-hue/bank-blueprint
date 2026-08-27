/**
 * Onboarding schemas shared by the UI and the server functions (§65).
 * Client-side use is for UX only; the server re-validates every payload.
 */
import { z } from "zod";

const MIN_AGE = 18;

export const profileStepSchema = z.object({
  firstName: z.string().trim().min(2, "Indiquez votre prénom.").max(60),
  middleName: z.string().trim().max(60).optional().or(z.literal("")),
  lastName: z.string().trim().min(2, "Indiquez votre nom.").max(60),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Utilisez le format AAAA-MM-JJ.")
    .refine((value) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      const now = new Date();
      const eighteen = new Date(
        now.getFullYear() - MIN_AGE,
        now.getMonth(),
        now.getDate(),
      );
      return date <= eighteen && date > new Date("1900-01-01");
    }, `Vous devez avoir au moins ${MIN_AGE} ans pour ouvrir un compte.`),
  nationality: z.string().trim().min(2, "Indiquez votre nationalité.").max(60),
  countryOfResidence: z.string().trim().min(2, "Indiquez votre pays de résidence.").max(60),
  occupation: z.string().trim().min(2, "Indiquez votre profession.").max(80),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\+?[0-9 ().-]{6,24}$/.test(value), {
      message: "Numéro de téléphone invalide.",
    }),
});

export const addressStepSchema = z.object({
  country: z.string().trim().min(2, "Indiquez le pays.").max(60),
  addressLine1: z.string().trim().min(3, "Indiquez votre adresse.").max(120),
  addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Indiquez la ville.").max(80),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
});

export const DOCUMENT_TYPES = [
  "IDENTITY_CARD",
  "PASSPORT",
  "RESIDENCE_PERMIT",
  "PROOF_OF_ADDRESS",
  "ADDITIONAL_DOCUMENT",
] as const;

export const DOCUMENT_TYPE_LABELS: Record<(typeof DOCUMENT_TYPES)[number], string> = {
  IDENTITY_CARD: "Carte d'identité",
  PASSPORT: "Passeport",
  RESIDENCE_PERMIT: "Titre de séjour",
  PROOF_OF_ADDRESS: "Justificatif de domicile",
  ADDITIONAL_DOCUMENT: "Document complémentaire",
};

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const documentUploadSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  storagePath: z.string().min(1),
  originalFilename: z.string().max(255),
  mimeType: z.enum(ALLOWED_DOCUMENT_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_DOCUMENT_BYTES),
});

export type ProfileStepInput = z.infer<typeof profileStepSchema>;
export type AddressStepInput = z.infer<typeof addressStepSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
