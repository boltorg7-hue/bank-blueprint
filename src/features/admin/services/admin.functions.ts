import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  AdminAccountDto,
  AdminCustomerDto,
  AdminDashboardDto,
  FundingRequestDto,
  StaffContextDto,
  AdminExternalTransferDto,
  AdminOnboardingCaseDto,
  AdminAuditEventDto,
  AdminCustomerPageDto,\n  AdminAccountPageDto,
} from "@/features/admin/types/admin";

function customerSearchInput(input: { search?: string; cursor?: string | null; lifecycle?: string; accounts?: string; attention?: string } | undefined) {
  const lifecycle = String(input?.lifecycle ?? "ALL");
  const accounts = String(input?.accounts ?? "ALL");
  const attention = String(input?.attention ?? "ALL");
  if (!["ALL", "WITH_ACCOUNTS", "WITHOUT_ACCOUNTS"].includes(accounts) || !["ALL", "NEEDS_ATTENTION", "CLEAR"].includes(attention)) throw new Error("INVALID_CUSTOMER_FILTER");
  return {
    search: String(input?.search ?? "").trim().slice(0, 80),
    cursor: input?.cursor ? String(input.cursor).slice(0, 512) : null,
    lifecycle,
    accounts,
    attention,
  };
}
function searchInput(input: { search?: string; page?: number } | undefined) {
  return { search: String(input?.search ?? "").trim().slice(0, 80), page: Math.max(1, Math.floor(Number(input?.page ?? 1))) };
}

export const getAdminStaffContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StaffContextDto> => {
    const service = await import("@/features/admin/services/admin.server");
    return service.getStaffContext(context.supabase);
  });

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDashboardDto> => {
    const service = await import("@/features/admin/services/admin.server");
    return service.loadAdminDashboard(context.supabase);
  });

export const listAdminCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(customerSearchInput)
  .handler(async ({ data, context }): Promise<AdminCustomerPageDto> => {
    const service = await import("@/features/admin/services/admin.server");
    return service.loadAdminCustomers(context.supabase, data.search, data.cursor, data.lifecycle as any, data.accounts as any, data.attention as any);
  });

export const listAdminOnboardingCases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(searchInput)
  .handler(async ({ data, context }): Promise<AdminOnboardingCaseDto[]> => {
    const service = await import("@/features/admin/services/admin.server");
    return service.loadAdminOnboardingCases(context.supabase, data.search);
  });

export const inviteAdminCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; firstName: string; lastName: string }) => {
    const email = String(input?.email ?? "").trim().toLowerCase();
    const firstName = String(input?.firstName ?? "").trim();
    const lastName = String(input?.lastName ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || firstName.length < 2 || firstName.length > 80 || lastName.length < 2 || lastName.length > 80) throw new Error("INVALID_INVITATION");
    return { email, firstName, lastName };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/admin.server");
    return service.inviteCustomer(context.supabase, context.userId, data, "https://rfbank.lovable.app");
  });

export const reviewAdminOnboardingCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { customerId: string; recommendation: "APPROVE" | "REJECT" | "REQUEST_INFO"; note: string }) => {
    const customerId = String(input?.customerId ?? "");
    const note = String(input?.note ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(customerId) || !["APPROVE", "REJECT", "REQUEST_INFO"].includes(input?.recommendation) || note.length < 8 || note.length > 500) throw new Error("INVALID_REVIEW");
    return { customerId, recommendation: input.recommendation, note };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/admin.server");
    return service.reviewOnboardingCase(context.supabase, context.userId, data);
  });

export const decideAdminOnboardingCase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestId: string; confirm: boolean; note: string }) => {
    const requestId = String(input?.requestId ?? "");
    const note = String(input?.note ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || typeof input?.confirm !== "boolean" || note.length < 8 || note.length > 500) throw new Error("INVALID_DECISION");
    return { requestId, confirm: input.confirm, note };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/admin.server");
    return service.decideOnboardingCase(context.supabase, context.userId, data);
  });

export const activateAdminOnboardingCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { customerId: string; reason: string }) => {
    const customerId = String(input?.customerId ?? "");
    const reason = String(input?.reason ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(customerId) || reason.length < 8 || reason.length > 300) throw new Error("INVALID_ACTIVATION");
    return { customerId, reason };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/admin.server");
    return service.activateOnboardingCustomer(context.supabase, context.userId, data);
  });

export const listAdminAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(searchInput)
  .handler(async ({ data, context }): Promise<AdminAccountPageDto> => {
    const service = await import("@/features/admin/services/admin.server");
    return service.loadAdminAccounts(context.supabase, data.search, data.cursor ?? null);
  });

export const listFundingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FundingRequestDto[]> => {
    const service = await import("@/features/admin/services/admin.server");
    return service.loadFundingRequests(context.supabase);
  });

export const createFundingRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { accountReference: string; amountMinor: number; reason: string; idempotencyKey: string }) => {
    const accountReference = String(input?.accountReference ?? "").trim();
    const amountMinor = Number(input?.amountMinor);
    const reason = String(input?.reason ?? "").trim();
    const idempotencyKey = String(input?.idempotencyKey ?? "").trim();
    if (!/^ACC-\d{4}-\d{6}$/.test(accountReference)) throw new Error("INVALID_ACCOUNT_REFERENCE");
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || amountMinor > 100_000_000_000) throw new Error("INVALID_AMOUNT");
    if (reason.length < 8 || reason.length > 500) throw new Error("INVALID_REASON");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) throw new Error("INVALID_IDEMPOTENCY_KEY");
    return { accountReference, amountMinor, reason, idempotencyKey };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/admin.server");
    await service.requireAdminPermission(context.supabase, "finance.adjustment.create");
    const { data: result, error } = await context.supabase.rpc("create_funding_request", {
      _account_reference: data.accountReference,
      _amount_minor: data.amountMinor,
      _reason: data.reason,
      _idempotency_key: data.idempotencyKey,
    } as never);
    if (error) throw new Error("FUNDING_REQUEST_FAILED");
    return result;
  });

export const decideFundingRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestId: string; approve: boolean }) => {
    const requestId = String(input?.requestId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || typeof input?.approve !== "boolean") throw new Error("INVALID_DECISION");
    return { requestId, approve: input.approve };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/admin.server");
    await service.requireAdminPermission(context.supabase, "finance.adjustment.approve");
    const { data: result, error } = await context.supabase.rpc("decide_funding_request", {
      _request_id: data.requestId,
      _approve: data.approve,
    } as never);
    if (error) {
      if (error.message.toLowerCase().includes("four-eyes")) throw new Error("MAKER_CANNOT_APPROVE");
      throw new Error("FUNDING_DECISION_FAILED");
    }
    return result;
  });

export const setCustomerState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { customerId: string; state: "ACTIVE" | "RESTRICTED" | "SUSPENDED"; reason: string }) => {
    const customerId = String(input?.customerId ?? ""); const reason = String(input?.reason ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(customerId) || !["ACTIVE", "RESTRICTED", "SUSPENDED"].includes(input?.state) || reason.length < 8 || reason.length > 300) throw new Error("INVALID_STATE_CHANGE");
    return { customerId, state: input.state, reason };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/admin.server");
    await service.requireAdminPermission(context.supabase, "customers.write");
    const { error } = await context.supabase.rpc("admin_set_customer_state" as never, { _customer_id: data.customerId, _state: data.state, _reason: data.reason } as never);
    if (error) throw new Error("CUSTOMER_STATE_CHANGE_FAILED");
    return { success: true };
  });

export const setAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { accountReference: string; status: "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "FROZEN"; reason: string }) => {
    const accountReference = String(input?.accountReference ?? "").trim(); const reason = String(input?.reason ?? "").trim();
    if (!/^ACC-\d{4}-\d{6}$/.test(accountReference) || !["ACTIVE", "RESTRICTED", "SUSPENDED", "FROZEN"].includes(input?.status) || reason.length < 8 || reason.length > 300) throw new Error("INVALID_STATUS_CHANGE");
    return { accountReference, status: input.status, reason };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/admin.server");
    await service.requireAdminPermission(context.supabase, "accounts.manage");
    const { error } = await context.supabase.rpc("admin_set_account_status" as never, { _account_reference: data.accountReference, _status: data.status, _reason: data.reason } as never);
    if (error) throw new Error("ACCOUNT_STATUS_CHANGE_FAILED");
    return { success: true };
  });

export const listAdminAccountStatusHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { accountReference: string }) => {
    const accountReference = String(input?.accountReference ?? "").trim();
    if (!/^ACC-\d{4}-\d{6}$/.test(accountReference)) throw new Error("INVALID_ACCOUNT_REFERENCE");
    return { accountReference };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/admin.server");
    return service.loadAdminAccountStatusHistory(context.supabase, data.accountReference);
  });

export const listAdminExternalTransfers=createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context}):Promise<AdminExternalTransferDto[]>=>{const s=await import("@/features/admin/services/admin.server");return s.loadExternalTransfers(context.supabase);});
export const advanceAdminExternalTransfer=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:{reference:string;action:"APPROVE"|"QUEUE"|"FINALIZE"})=>{const reference=String(input?.reference??"");if(!/^TRF-\d{4}-\d{8}$/.test(reference)||!["APPROVE","QUEUE","FINALIZE"].includes(input?.action))throw new Error("INVALID_TRANSFER_ACTION");return {reference,action:input.action};}).handler(async({data,context})=>{const s=await import("@/features/admin/services/admin.server");await s.requireAdminPermission(context.supabase,data.action==="APPROVE"?"compliance.review":"transfers.approve");const rpc=data.action==="APPROVE"?"admin_approve_simulated_external":data.action==="QUEUE"?"admin_queue_simulated_external":"admin_finalize_simulated_external";const{error}=await context.supabase.rpc(rpc as any,{_reference:data.reference} as never);if(error)throw new Error(error.message.toLowerCase().includes("four-eyes")?"FOUR_EYES_REQUIRED":"TRANSFER_ACTION_FAILED");return{ok:true};});

export const listAdminAuditEvents = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(searchInput).handler(async ({ data, context }): Promise<AdminAuditEventDto[]> => {
  const service = await import("@/features/admin/services/admin.server");
  return service.loadAdminAuditEvents(context.supabase, data.search);
});


export const getAdminCustomerDossier = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { customerId: string }) => {
    const customerId = String(input?.customerId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(customerId)) throw new Error("INVALID_CUSTOMER_REFERENCE");
    return { customerId };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/admin.server");
    return service.loadAdminCustomerDossier(context.supabase, data.customerId);
  });
