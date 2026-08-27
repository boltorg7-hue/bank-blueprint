import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  CustomerAccountDetailsDto,
  CustomerAccountSummaryDto,
  DashboardSummaryDto,
} from "@/features/accounts/types/account";

/**
 * Account server functions (§167). Thin wrappers only: every runtime helper
 * lives in accounts.server.ts and is imported inside the handler.
 */

export const getCustomerAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomerAccountSummaryDto[]> => {
    const service = await import("@/features/accounts/services/accounts.server");
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("lifecycle_state")
      .eq("id", context.userId)
      .maybeSingle();
    if (profile?.lifecycle_state === "ACTIVE") {
      await service.ensurePrimaryAccount(context.supabase, context.userId);
    }
    return service.loadCustomerAccounts(context.supabase, context.userId);
  });

export const getAccountDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reference: string }) => {
    const reference = String(input?.reference ?? "").trim();
    if (!/^ACC-\d{4}-\d{6}$/.test(reference)) {
      throw new Error("INVALID_ACCOUNT_REFERENCE");
    }
    return { reference };
  })
  .handler(async ({ data, context }): Promise<CustomerAccountDetailsDto | null> => {
    const service = await import("@/features/accounts/services/accounts.server");
    return service.loadAccountDetails(context.supabase, context.userId, data.reference);
  });

export const getDashboardSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardSummaryDto> => {
    const service = await import("@/features/accounts/services/accounts.server");
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("lifecycle_state")
      .eq("id", context.userId)
      .maybeSingle();
    return service.loadDashboardSummary(
      context.supabase,
      context.userId,
      profile?.lifecycle_state ?? "REGISTERED",
    );
  });
