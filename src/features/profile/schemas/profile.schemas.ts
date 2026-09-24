import { z } from "zod";
import { addressStepSchema, profileStepSchema } from "@/features/onboarding/schemas/onboarding.schemas";

export const permanentProfileSchema = profileStepSchema;
export const permanentAddressSchema = addressStepSchema;
export const preferencesSchema = z.object({
  language: z.enum(["fr", "en"]),
  theme: z.enum(["light", "dark", "system"]),
  privacyModeDefault: z.boolean(),
  smsTransactions: z.boolean(),
  smsSecurity: z.boolean(),
  emailService: z.boolean(),
});
