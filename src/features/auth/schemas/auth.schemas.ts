/**
 * Authentication schemas (PROMPT 03 §65).
 * Client-side validation for immediate UX; the server remains authoritative.
 */
import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Indiquez votre adresse e-mail.")
  .email("Adresse e-mail invalide.");

/** Password guidance shown to customers (§10, §11) — no absurd symbol rules. */
export const PASSWORD_RULES = [
  "12 caractères minimum",
  "au moins une lettre majuscule et une minuscule",
  "au moins un chiffre",
] as const;

export const passwordSchema = z
  .string()
  .min(12, "Utilisez au moins 12 caractères.")
  .max(128, "Mot de passe trop long.")
  .refine((value) => /[a-z]/.test(value) && /[A-Z]/.test(value), {
    message: "Ajoutez une lettre majuscule et une lettre minuscule.",
  })
  .refine((value) => /\d/.test(value), { message: "Ajoutez au moins un chiffre." });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Saisissez votre mot de passe."),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Indiquez votre prénom.").max(60),
    lastName: z.string().trim().min(2, "Indiquez votre nom.").max(60),
    email,
    phone: z
      .string()
      .trim()
      .max(24, "Numéro trop long.")
      .refine((value) => value === "" || /^\+?[0-9 ().-]{6,}$/.test(value), {
        message: "Numéro de téléphone invalide.",
      }),
    password: passwordSchema,
    confirmPassword: z.string(),
    terms: z.literal(true, { message: "Vous devez accepter les conditions et la politique de confidentialité." }),
    marketing: z.boolean(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/** Turns a Zod error into a field → message map (first message wins). */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
