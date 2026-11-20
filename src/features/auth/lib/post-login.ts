/**
 * Post-login routing (§26).
 * The destination comes from trusted server state, never from local storage.
 * A caller-supplied redirect is honoured only when it is a safe same-origin
 * path AND the customer's state allows entering the banking app.
 */
import { nextRouteForLifecycle } from "@/types/customer-lifecycle";
import { getCustomerContext } from "@/features/onboarding/services/onboarding.functions";

export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function resolvePostLoginRoute(redirectTo?: string | undefined): Promise<string> {
  let lifecycleRoute = "/app/dashboard";
  try {
    const context = await getCustomerContext();
    if (!context.emailVerified) {
      lifecycleRoute = "/verify-email";
    } else if (context.profile.lifecycle_state === "CLOSED") {
      lifecycleRoute = nextRouteForLifecycle(context.profile.lifecycle_state);
    } else {
      // Verified customers enter the dashboard; outstanding onboarding is surfaced there.
      lifecycleRoute = "/app/dashboard";
    }
  } catch {
    // Do not force customers into onboarding when trusted context is temporarily unavailable.
    // The customer shell presents a retry state and does not grant transactions.
    lifecycleRoute = "/app/dashboard";
  }

  const requested = safeRedirectPath(redirectTo);
  if (requested && lifecycleRoute.startsWith("/app")) return requested;
  return lifecycleRoute;
}
