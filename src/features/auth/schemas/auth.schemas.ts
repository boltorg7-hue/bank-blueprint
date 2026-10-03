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
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

type ValidationLanguage = "fr" | "en";

const VALIDATION_MESSAGES: Record<string, string> = {
  "Indiquez votre adresse e-mail.": "Enter your email address.",
  "Adresse e-mail invalide.": "Enter a valid email address.",
  "Utilisez au moins 12 caractères.": "Use at least 12 characters.",
  "Mot de passe trop long.": "Password is too long.",
  "Ajoutez une lettre majuscule et une lettre minuscule.": "Add an uppercase letter and a lowercase letter.",
  "Ajoutez au moins un chiffre.": "Add at least one number.",
  "Saisissez votre mot de passe.": "Enter your password.",
  "Indiquez votre prénom.": "Enter your first name.",
  "Indiquez votre nom.": "Enter your last name.",
  "Vous devez accepter les conditions et la politique de confidentialité.": "You must accept the terms and privacy policy.",
  "Les deux mots de passe ne correspondent pas.": "The passwords do not match.",
  "Indiquez un numéro international valide avec son indicatif (+...).": "Enter a valid international phone number with its country code (+...).",
  "Numéro trop long.": "Phone number is too long.",
  "Utilisez le format international, par exemple +237 6 99 99 99 99.": "Use the international format, for example +237 6 99 99 99 99.",
  "Indiquez votre nationalité.": "Enter your nationality.",
  "Indiquez votre pays de résidence.": "Enter your country of residence.",
  "Indiquez votre profession.": "Enter your occupation.",
  "Utilisez le format AAAA-MM-JJ.": "Use the YYYY-MM-DD format.",
  "Vous devez avoir au moins 18 ans pour ouvrir un compte.": "You must be at least 18 years old to open an account.",
  "Indiquez le pays.": "Enter the country.",
  "Indiquez votre adresse.": "Enter your address.",
  "Indiquez la ville.": "Enter the city.",
};

/** Turns a Zod error into a field → localized message map (first message wins). */
export function fieldErrorsFrom(error: z.ZodError, language: ValidationLanguage = "fr"): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = language === "en" ? VALIDATION_MESSAGES[issue.message] ?? issue.message : issue.message;
  }
  return errors;
}
