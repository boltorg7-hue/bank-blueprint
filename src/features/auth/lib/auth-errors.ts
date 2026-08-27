/**
 * Safe authentication messaging (PROMPT 03 §19, §67).
 * Raw backend errors are never shown to customers, and sign-in failures never
 * reveal whether a given account exists.
 */

const GENERIC_SIGN_IN = "Nous n'avons pas pu vous connecter avec ces informations.";
const GENERIC = "Nous n'avons pas pu traiter votre demande pour le moment. Réessayez.";

export function signInErrorMessage(error: unknown): string {
  const code = errorCode(error);
  if (code === "email_not_confirmed") {
    return "Votre adresse e-mail n'est pas encore confirmée. Vérifiez votre messagerie.";
  }
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return "Trop de tentatives. Patientez quelques instants avant de réessayer.";
  }
  return GENERIC_SIGN_IN;
}

export function signUpErrorMessage(error: unknown): string {
  const code = errorCode(error);
  if (code === "weak_password") {
    return "Ce mot de passe est trop faible ou trop courant. Choisissez-en un autre.";
  }
  if (code === "user_already_exists" || code === "email_exists") {
    // Do not confirm account existence explicitly.
    return "Nous n'avons pas pu créer ce compte. Si vous avez déjà un compte, connectez-vous ou réinitialisez votre mot de passe.";
  }
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    return "Trop de tentatives. Patientez quelques instants avant de réessayer.";
  }
  return GENERIC;
}

export function genericErrorMessage(): string {
  return GENERIC;
}

function errorCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return null;
}

/** Masks an e-mail for shared screens (§14): j••••@example.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "•••";
  return `${local.slice(0, 1)}${"•".repeat(Math.max(3, Math.min(local.length - 1, 5)))}@${domain}`;
}
