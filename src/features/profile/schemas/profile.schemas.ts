import { z } from "zod";
import { addressStepSchema, internationalPhoneSchema, profileStepSchema } from "@/features/onboarding/schemas/onboarding.schemas";

export const permanentProfileSchema = profileStepSchema.extend({
  phone: internationalPhoneSchema.or(z.literal("")),
});
export const permanentAddressSchema = addressStepSchema;
export const preferencesSchema = z.object({
  language: z.enum(["fr", "en"]),
  theme: z.enum(["light", "dark", "system"]),
  privacyModeDefault: z.boolean(),
  smsTransactions: z.boolean(),
  smsSecurity: z.boolean(),
  emailService: z.boolean(),
});
