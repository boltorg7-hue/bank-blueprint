import type { SupabaseClient } from "@supabase/supabase-js";

import type { SupportThreadDto } from "@/features/support/types/support";

type Client = SupabaseClient<any, any, any>;

async function mapThreads(client: Client, rows: any[], customerNames?: Map<string, string>) {
  const ids = rows.map((row) => String(row.id));
  const { data: messages, error } = ids.length
    ? await client.from("support_messages").select("id,thread_id,author_kind,body,created_at").in("thread_id", ids).order("created_at")
    : { data: [], error: null };
  if (error) throw new Error("SUPPORT_MESSAGES_UNAVAILABLE");
  return rows.map((row): SupportThreadDto => ({
    id: row.id,
    reference: row.public_reference,
    ...(customerNames ? { customerName: customerNames.get(row.customer_user_id) ?? "Client" } : {}),
    subject: row.subject,
    category: row.category,
    status: row.status,
    lastMessageAt: row.last_message_at,
    messages: (messages ?? []).filter((message: any) => message.thread_id === row.id).map((message: any) => ({
      id: message.id,
      authorKind: message.author_kind,
      body: message.body,
      createdAt: message.created_at,
    })),
  }));
}

export async function loadCustomerSupport(client: Client, userId: string): Promise<SupportThreadDto[]> {
  const { data, error } = await client.from("support_threads").select("id,public_reference,customer_user_id,subject,category,status,last_message_at").eq("customer_user_id", userId).order("last_message_at", { ascending: false });
  if (error) throw new Error("SUPPORT_UNAVAILABLE");
  return mapThreads(client, data ?? []);
}

export async function loadAdminSupport(client: Client): Promise<SupportThreadDto[]> {
  const adminService = await import("@/features/admin/services/admin.server");
  await adminService.requireAdminPermission(client, "support.read");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as Client;
  const { data, error } = await admin.from("support_threads").select("id,public_reference,customer_user_id,subject,category,status,last_message_at").order("last_message_at", { ascending: false }).limit(100);
  if (error) throw new Error("SUPPORT_UNAVAILABLE");
  const userIds = [...new Set((data ?? []).map((row: any) => String(row.customer_user_id)))];
  const { data: profiles } = userIds.length ? await admin.from("profiles").select("id,first_name,last_name").in("id", userIds) : { data: [] as any[] };
  const names = new Map((profiles ?? []).map((profile: any) => [profile.id, [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Client"]));
  return mapThreads(admin, data ?? [], names);
}
