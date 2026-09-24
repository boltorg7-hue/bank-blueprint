import { createServerFn } from "@tanstack/react-start";

import type { SupportCategory, SupportStatus, SupportThreadDto } from "@/features/support/types/support";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const categories: SupportCategory[] = ["ACCOUNT", "TRANSFER", "DOCUMENT", "SECURITY", "OTHER"];
const statuses: SupportStatus[] = ["OPEN", "WAITING_SUPPORT", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function bodyValue(value: unknown) { const body = String(value ?? "").trim(); if (body.length < 1 || body.length > 4000) throw new Error("INVALID_MESSAGE"); return body; }

export const getCustomerSupport = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<SupportThreadDto[]> => {
  const service = await import("@/features/support/services/support.server");
  return service.loadCustomerSupport(context.supabase, context.userId);
});

export const getAdminSupport = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<SupportThreadDto[]> => {
  const service = await import("@/features/support/services/support.server");
  return service.loadAdminSupport(context.supabase);
});

export const createSupportThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: { subject: string; category: SupportCategory; body: string }) => {
  const subject = String(input?.subject ?? "").trim(); if (subject.length < 5 || subject.length > 120 || !categories.includes(input?.category)) throw new Error("INVALID_THREAD");
  return { subject, category: input.category, body: bodyValue(input.body) };
}).handler(async ({ data, context }) => { const { error } = await context.supabase.rpc("create_support_thread" as any, { _subject: data.subject, _category: data.category, _body: data.body } as never); if (error) throw new Error("SUPPORT_CREATE_FAILED"); return { ok: true }; });

export const replySupportThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: { threadId: string; body: string }) => { if (!uuid.test(input?.threadId)) throw new Error("INVALID_THREAD"); return { threadId: input.threadId, body: bodyValue(input.body) }; }).handler(async ({ data, context }) => { const { error } = await context.supabase.rpc("reply_support_thread" as any, { _thread_id: data.threadId, _body: data.body } as never); if (error) throw new Error("SUPPORT_REPLY_FAILED"); return { ok: true }; });

export const staffReplySupportThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: { threadId: string; body: string }) => { if (!uuid.test(input?.threadId)) throw new Error("INVALID_THREAD"); return { threadId: input.threadId, body: bodyValue(input.body) }; }).handler(async ({ data, context }) => { const admin = await import("@/features/admin/services/admin.server"); await admin.requireAdminPermission(context.supabase, "support.reply"); const { error } = await context.supabase.rpc("staff_reply_support_thread" as any, { _thread_id: data.threadId, _body: data.body } as never); if (error) throw new Error("SUPPORT_REPLY_FAILED"); return { ok: true }; });

export const setSupportStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: { threadId: string; status: SupportStatus }) => { if (!uuid.test(input?.threadId) || !statuses.includes(input?.status)) throw new Error("INVALID_STATUS"); return input; }).handler(async ({ data, context }) => { const admin = await import("@/features/admin/services/admin.server"); await admin.requireAdminPermission(context.supabase, "support.reply"); const { error } = await context.supabase.rpc("staff_set_support_status" as any, { _thread_id: data.threadId, _status: data.status } as never); if (error) throw new Error("SUPPORT_STATUS_FAILED"); return { ok: true }; });
