import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  AdminAccountDto,
  AdminCustomerDto,
  AdminDashboardDto,
  FundingRequestDto,
  StaffContextDto,
  AdminExternalTransferDto,
} from "@/features/admin/types/admin";

function searchInput(input: { search?: string } | undefined) {
  return { search: String(input?.search ?? "").trim().slice(0, 80) };
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
  .inputValidator(searchInput)
  .handler(async ({ data, context }): Promise<AdminCustomerDto[]> => {
    const service = await import("@/features/admin/services/admin.server");
    return service.loadAdminCustomers(context.supabase, data.search);
  });

export const listAdminAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(searchInput)
  .handler(async ({ data, context }): Promise<AdminAccountDto[]> => {
    const service = await import("@/features/admin/services/admin.server");
    return service.loadAdminAccounts(context.supabase, data.search);
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
    const { error } = await context.supabase.rpc("admin_set_customer_state", { _customer_id: data.customerId, _state: data.state, _reason: data.reason } as never);
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
    const { error } = await context.supabase.rpc("admin_set_account_status", { _account_reference: data.accountReference, _status: data.status, _reason: data.reason } as never);
    if (error) throw new Error("ACCOUNT_STATUS_CHANGE_FAILED");
    return { success: true };
  });

export const listAdminExternalTransfers=createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async({context}):Promise<AdminExternalTransferDto[]>=>{const s=await import("@/features/admin/services/admin.server");return s.loadExternalTransfers(context.supabase);});
export const advanceAdminExternalTransfer=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input:{reference:string;action:"APPROVE"|"QUEUE"|"FINALIZE"})=>{const reference=String(input?.reference??"");if(!/^TRF-\d{4}-\d{8}$/.test(reference)||!["APPROVE","QUEUE","FINALIZE"].includes(input?.action))throw new Error("INVALID_TRANSFER_ACTION");return {reference,action:input.action};}).handler(async({data,context})=>{const s=await import("@/features/admin/services/admin.server");await s.requireAdminPermission(context.supabase,data.action==="APPROVE"?"compliance.review":"transfers.approve");const rpc=data.action==="APPROVE"?"admin_approve_simulated_external":data.action==="QUEUE"?"admin_queue_simulated_external":"admin_finalize_simulated_external";const{error}=await context.supabase.rpc(rpc as any,{_reference:data.reference} as never);if(error)throw new Error(error.message.toLowerCase().includes("four-eyes")?"FOUR_EYES_REQUIRED":"TRANSFER_ACTION_FAILED");return{ok:true};});
