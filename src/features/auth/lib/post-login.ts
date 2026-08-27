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
  let lifecycleRoute = "/onboarding";
  try {
    const context = await getCustomerContext();
    lifecycleRoute = nextRouteForLifecycle(context.profile.lifecycle_state);
  } catch {
    lifecycleRoute = "/onboarding";
  }

  const requested = safeRedirectPath(redirectTo);
  if (requested && lifecycleRoute.startsWith("/app")) return requested;
  return lifecycleRoute;
}
