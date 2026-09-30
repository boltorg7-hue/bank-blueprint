/**
 * Safe authentication messaging (PROMPT 03 §19, §67).
 * Raw backend errors are never shown to customers, and sign-in failures never
 * reveal whether a given account exists.
 */

type Lang = "fr" | "en";

const M = {
  signIn: {
    fr: "Nous n'avons pas pu vous connecter avec ces informations.",
    en: "We couldn't sign you in with these details.",
  },
  generic: {
    fr: "Nous n'avons pas pu traiter votre demande pour le moment. Réessayez.",
    en: "We couldn't process your request right now. Please try again.",
  },
  notConfirmed: {
    fr: "Votre adresse e-mail n'est pas encore confirmée. Vérifiez votre messagerie.",
    en: "Your email address is not confirmed yet. Please check your inbox.",
  },
  rate: {
    fr: "Trop de tentatives. Patientez quelques instants avant de réessayer.",
    en: "Too many attempts. Please wait a moment before trying again.",
  },
  weak: {
    fr: "Ce mot de passe est trop faible ou trop courant. Choisissez-en un autre.",
    en: "This password is too weak or too common. Please choose another one.",
  },
  exists: {
    fr: "Nous n'avons pas pu créer ce compte. Si vous avez déjà un compte, connectez-vous ou réinitialisez votre mot de passe.",
    en: "We couldn't create this account. If you already have one, sign in or reset your password.",
  },
  badEmail: {
    fr: "Cette adresse e-mail ne peut pas recevoir de messages. Utilisez une adresse e-mail réelle.",
    en: "This email address can't receive messages. Please use a real email address.",
  },
} as const;

export function signInErrorMessage(error: unknown, lang: Lang = "fr"): string {
  const code = errorCode(error);
  if (code === "email_not_confirmed") return M.notConfirmed[lang];
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") return M.rate[lang];
  return M.signIn[lang];
}

export function signUpErrorMessage(error: unknown, lang: Lang = "fr"): string {
  const code = errorCode(error);
  if (code === "weak_password") return M.weak[lang];
  // Do not confirm account existence explicitly.
  if (code === "user_already_exists" || code === "email_exists") return M.exists[lang];
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") return M.rate[lang];
  if (code === "email_address_invalid" || /email address is not allowed|invalid/i.test(errorText(error))) {
    return M.badEmail[lang];
  }
  return M.generic[lang];
}

export function genericErrorMessage(lang: Lang = "fr"): string {
  return M.generic[lang];
}

function errorCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return null;
}

function errorText(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

/** Masks an e-mail for shared screens (§14): j••••@example.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "•••";
  return `${local.slice(0, 1)}${"•".repeat(Math.max(3, Math.min(local.length - 1, 5)))}@${domain}`;
}
