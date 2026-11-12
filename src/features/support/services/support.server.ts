import type { SupabaseClient } from "@supabase/supabase-js";

import type { SupportThreadDto, SupportThreadPageDto } from "@/features/support/types/support";

type Client = SupabaseClient<any, any, any>;

const SUPPORT_PAGE_SIZE = 25;

type SupportCursor = { lastMessageAt: string; id: string };

const SUPPORT_CURSOR_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SUPPORT_CURSOR_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

function encodeSupportCursor(value: SupportCursor): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeSupportCursor(value?: string | null): SupportCursor | null {
  if (!value) return null;
  if (!/^[A-Za-z0-9_-]{1,512}$/.test(value)) {
    throw new Error("INVALID_SUPPORT_CURSOR");
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const validTimestamp =
      typeof parsed?.lastMessageAt === "string" &&
      SUPPORT_CURSOR_TIMESTAMP.test(parsed.lastMessageAt) &&
      Number.isFinite(Date.parse(parsed.lastMessageAt));
    const validId = typeof parsed?.id === "string" && SUPPORT_CURSOR_UUID.test(parsed.id);

    if (!validTimestamp || !validId) {
      throw new Error("INVALID_SUPPORT_CURSOR");
    }

    return { lastMessageAt: parsed.lastMessageAt, id: parsed.id };
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_SUPPORT_CURSOR") throw error;
    throw new Error("INVALID_SUPPORT_CURSOR");
  }
}

async function mapThreads(client: Client, rows: any[], customerNames?: Map<string, string>) {
  const ids = rows.map((row) => String(row.id));
  const { data: messages, error } = ids.length
    ? await client
        .from("support_messages")
        .select("id,thread_id,author_kind,body,created_at")
        .in("thread_id", ids)
        .order("created_at")
    : { data: [], error: null };
  if (error) throw new Error("SUPPORT_MESSAGES_UNAVAILABLE");

  const messagesByThread = new Map<string, any[]>();
  for (const message of messages ?? []) {
    const key = String(message.thread_id);
    const bucket = messagesByThread.get(key) ?? [];
    bucket.push(message);
    messagesByThread.set(key, bucket);
  }

  return rows.map((row): SupportThreadDto => ({
    id: row.id,
    reference: row.public_reference,
    ...(customerNames ? { customerName: customerNames.get(row.customer_user_id) ?? "Client" } : {}),
    subject: row.subject,
    category: row.category,
    status: row.status,
    lastMessageAt: row.last_message_at,
    messages: (messagesByThread.get(String(row.id)) ?? []).map((message: any) => ({
      id: message.id,
      authorKind: message.author_kind,
      body: message.body,
      createdAt: message.created_at,
    })),
  }));
}

export async function loadCustomerSupport(
  client: Client,
  userId: string,
  cursor: string | null = null,
): Promise<SupportThreadPageDto> {
  const cursorValue = decodeSupportCursor(cursor);
  let query = client
    .from("support_threads")
    .select("id,public_reference,customer_user_id,subject,category,status,last_message_at")
    .eq("customer_user_id", userId)
    .order("last_message_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(SUPPORT_PAGE_SIZE + 1);

  if (cursorValue) {
    query = query.or(`last_message_at.lt.${cursorValue.lastMessageAt},and(last_message_at.eq.${cursorValue.lastMessageAt},id.lt.${cursorValue.id})`);
  }

  const { data, error } = await query;
  if (error) throw new Error("SUPPORT_UNAVAILABLE");
  const rows = data ?? [];
  const hasNext = rows.length > SUPPORT_PAGE_SIZE;
  const pageRows = rows.slice(0, SUPPORT_PAGE_SIZE);
  return {
    items: await mapThreads(client, pageRows),
    hasNext,
    nextCursor: (() => { const lastRow = pageRows[pageRows.length - 1]; return hasNext && lastRow
      ? encodeSupportCursor({ lastMessageAt: String(lastRow.last_message_at), id: String(lastRow.id) })
      : null; })(),
  };
}

export async function loadAdminSupport(
  client: Client,
  cursor: string | null = null,
): Promise<SupportThreadPageDto> {
  const adminService = await import("@/features/admin/services/admin.server");
  await adminService.requireAdminPermission(client, "support.read");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as Client;
  const cursorValue = decodeSupportCursor(cursor);

  let query = admin
    .from("support_threads")
    .select("id,public_reference,customer_user_id,subject,category,status,last_message_at")
    .order("last_message_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(SUPPORT_PAGE_SIZE + 1);

  if (cursorValue) {
    query = query.or(`last_message_at.lt.${cursorValue.lastMessageAt},and(last_message_at.eq.${cursorValue.lastMessageAt},id.lt.${cursorValue.id})`);
  }

  const { data, error } = await query;
  if (error) throw new Error("SUPPORT_UNAVAILABLE");

  const rows = data ?? [];
  const hasNext = rows.length > SUPPORT_PAGE_SIZE;
  const pageRows = rows.slice(0, SUPPORT_PAGE_SIZE);
  const userIds = [...new Set(pageRows.map((row: any) => String(row.customer_user_id)))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id,first_name,last_name").in("id", userIds)
    : { data: [] as any[] };
  const names = new Map((profiles ?? []).map((profile: any) => [
    String(profile.id),
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Client",
  ]));

  return {
    items: await mapThreads(admin, pageRows, names),
    hasNext,
    nextCursor: (() => { const lastRow = pageRows[pageRows.length - 1]; return hasNext && lastRow
      ? encodeSupportCursor({ lastMessageAt: String(lastRow.last_message_at), id: String(lastRow.id) })
      : null; })(),
  };
}
