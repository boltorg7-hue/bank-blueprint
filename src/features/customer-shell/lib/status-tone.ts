import type { StatusTone } from "@/components/ui/status-badge";
import type { CustomerLifecycleState } from "@/types/customer-lifecycle";

/** Maps a trusted lifecycle state onto the shared status vocabulary (§43). */
export function lifecycleStatusTone(state: CustomerLifecycleState): StatusTone {
  switch (state) {
    case "ACTIVE":
    case "IDENTITY_VERIFIED":
      return "success";
    case "RESTRICTED":
    case "SUSPENDED":
    case "CLOSED":
      return "failed";
    case "IDENTITY_UNDER_REVIEW":
    case "IDENTITY_SUBMITTED":
    case "BANKING_REVIEW":
      return "info";
    default:
      return "pending";
  }
}
