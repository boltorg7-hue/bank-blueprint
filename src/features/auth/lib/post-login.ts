/**
 * Post-login routing (§26).
 * The destination comes from trusted server state, never from local storage.
 * A caller-supplied redirect is honoured only when it is a safe same-origin
 * path AND the customer's state allows entering the banking app.
 */
import { nextRouteForLifecycle } from "@/types/customer-lifecycle";
import { getCustomerContext } from "@/features/onboarding/services/onboarding.functions";
import { nextOnboardingRoute } from "@/features/onboarding/lib/tasks";
import { getOAuthConsentStatus } from "@/features/auth/services/oauth-consent.functions";

export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function resolvePostLoginRoute(redirectTo?: string | undefined): Promise<string> {
  try {
    const consent = await getOAuthConsentStatus();
    if (consent.required) return "/auth/consent";
  } catch {
    // Fail closed: an OAuth consent status that cannot be verified must not enter onboarding.
    return "/auth/consent";
  }

  let lifecycleRoute = "/onboarding";
  try {
    const context = await getCustomerContext();
    if (!context.emailVerified) {
      lifecycleRoute = "/verify-email";
    } else if (
      ["ACTIVE", "RESTRICTED", "SUSPENDED", "CLOSED"].includes(context.profile.lifecycle_state)
    ) {
      lifecycleRoute = nextRouteForLifecycle(context.profile.lifecycle_state);
    } else {
      lifecycleRoute = nextOnboardingRoute(context);
    }
  } catch {
    lifecycleRoute = "/onboarding";
  }

  const requested = safeRedirectPath(redirectTo);
  if (requested && lifecycleRoute.startsWith("/app")) return requested;
  return lifecycleRoute;
}
