import { useCustomerContext } from "@/features/onboarding/hooks/useCustomerContext";
import type { CustomerLifecycleState } from "@/types/customer-lifecycle";

/**
 * Minimal authenticated customer summary for the shell (§100, §101).
 * The shell reads lifecycle + display identity only — never full transaction
 * history, statements or messages.
 */
export type CustomerSummary = {
  displayName: string;
  initials: string;
  lifecycleState: CustomerLifecycleState;
  /** Trusted count of customer actions awaiting attention (0 when none). */
  actionRequiredCount: number;
  /** Null while no trusted notification service exists (never fabricated). */
  unreadNotificationCount: number | null;
};

function initialsFrom(first: string | null, last: string | null, fallback: string) {
  const letters = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.trim();
  return (letters || fallback.slice(0, 2)).toUpperCase();
}

export function useCustomerSummary() {
  const query = useCustomerContext();
  const context = query.data;

  const summary: CustomerSummary | null = context
    ? {
        displayName:
          [context.profile.first_name, context.profile.last_name]
            .filter(Boolean)
            .join(" ") || (context.email ?? "Client"),
        initials: initialsFrom(
          context.profile.first_name,
          context.profile.last_name,
          context.email ?? "CL",
        ),
        lifecycleState: context.profile.lifecycle_state,
        actionRequiredCount:
          context.documents.filter((doc) => doc.status === "ACTION_REQUIRED").length +
          (context.verification.status === "ADDITIONAL_INFORMATION_REQUIRED" ? 1 : 0),
        unreadNotificationCount: null,
      }
    : null;

  return { summary, isPending: query.isPending, isError: query.isError, refetch: query.refetch };
}
