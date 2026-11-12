import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationCenterDto, NotificationDto } from "@/domain/notifications/types";

type Client = SupabaseClient;

export async function dispatchPendingSms(userId: string) {
  const providerName = process.env["SMS_PROVIDER"]?.trim().toLowerCase() || "africastalking";
  const { africaTalkingSmsProvider } =
    providerName === "africastalking"
      ? await import("@/features/notifications/services/sms/africastalking-provider")
      : providerName === "simulation"
        ? {
            africaTalkingSmsProvider: (
              await import("@/features/notifications/services/sms/simulation-provider")
            ).simulationSmsProvider,
          }
        : { africaTalkingSmsProvider: null };

  if (!africaTalkingSmsProvider) throw new Error("SMS_PROVIDER_UNSUPPORTED");
  const provider = africaTalkingSmsProvider;
  const adminModule = await import("@/integrations/supabase/client.server");
  const admin = adminModule.supabaseAdmin as SupabaseClient;

  // Claim rows atomically in PostgreSQL. Concurrent requests cannot dispatch
  // the same pending SMS because the RPC locks candidates with SKIP LOCKED.
  const { data: rows, error: claimError } = await admin.rpc("claim_pending_sms_notifications", {
    _user_id: userId,
  });
  if (claimError) throw new Error("SMS_QUEUE_CLAIM_FAILED");
  if (!rows?.length) return { processed: 0 };

  let processed = 0;
  for (const row of rows) {
    let result;
    try {
      result = await provider.send({
        recipient: row.recipient,
        templateKey: row.template_key,
        payload: row.payload ?? {},
      });
    } catch {
      result = {
        state: "FAILED" as const,
        providerReference: null,
        errorCode: "SMS_PROVIDER_REQUEST_FAILED",
      };
    }

    const { error: updateError } = await admin
      .from("notification_outbox")
      .update({
        status: result.state,
        provider_reference: result.providerReference,
        payload: {},
        processed_at: new Date().toISOString(),
        claimed_at: null,
        last_error_code: result.errorCode,
      })
      .eq("id", row.id)
      .eq("user_id", userId)
      .eq("status", "PROCESSING");

    if (updateError) throw new Error("SMS_QUEUE_UPDATE_FAILED");
    processed++;
  }

  return { processed };
}

export async function simulatePendingSms(userId: string) {
  const previousProvider = process.env["SMS_PROVIDER"];
  process.env["SMS_PROVIDER"] = "simulation";
  try {
    return await dispatchPendingSms(userId);
  } finally {
    if (previousProvider === undefined) delete process.env["SMS_PROVIDER"];
    else process.env["SMS_PROVIDER"] = previousProvider;
  }
}

const NOTIFICATION_PAGE_SIZE = 25;
type NotificationCursor = { createdAt: string; id: string };
function encodeNotificationCursor(v: NotificationCursor) {
  return Buffer.from(JSON.stringify(v), "utf8").toString("base64url");
}
function decodeNotificationCursor(v?: string | null): NotificationCursor | null {
  if (!v) return null;
  try {
    const p = JSON.parse(Buffer.from(v, "base64url").toString("utf8"));
    return typeof p?.createdAt === "string" && typeof p?.id === "string"
      ? { createdAt: p.createdAt, id: p.id }
      : null;
  } catch {
    return null;
  }
}

export async function loadNotifications(
  client: Client,
  userId: string,
  options: { category?: string; cursor?: string | null } = {},
): Promise<NotificationCenterDto> {
  const allowed = ["ALL", "ACCOUNT", "TRANSFER", "FUNDING", "PRICING", "SECURITY", "SERVICE"];
  const category = allowed.includes(options.category ?? "ALL")
    ? (options.category ?? "ALL")
    : "ALL";
  const cursor = decodeNotificationCursor(options.cursor);
  let query = client
    .from("notifications")
    .select("id,category,severity,title,body,resource_path,read_at,created_at")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(NOTIFICATION_PAGE_SIZE + 1);
  if (category !== "ALL") query = query.eq("category", category);
  if (cursor)
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    );
  const [{ data, error }, { count: unreadCount, error: countError }] = await Promise.all([
    query,
    client
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("archived_at", null)
      .is("read_at", null),
  ]);
  if (error || countError) throw new Error("NOTIFICATIONS_UNAVAILABLE");
  const rows = data ?? [];
  const hasNext = rows.length > NOTIFICATION_PAGE_SIZE;
  const items = rows.slice(0, NOTIFICATION_PAGE_SIZE).map((item) => ({
    id: String(item.id),
    category: String(item.category),
    severity: String(item.severity) as NotificationDto["severity"],
    title: String(item.title),
    body: String(item.body),
    resourcePath: item.resource_path ? String(item.resource_path) : null,
    readAt: item.read_at ? String(item.read_at) : null,
    createdAt: String(item.created_at),
  }));
  const last = rows[NOTIFICATION_PAGE_SIZE - 1];
  return {
    items,
    unreadCount: unreadCount ?? 0,
    hasNext,
    nextCursor:
      hasNext && last
        ? encodeNotificationCursor({ createdAt: String(last.created_at), id: String(last.id) })
        : null,
  };
}

export async function markNotification(
  client: Client,
  userId: string,
  id: string,
  action: "READ" | "ARCHIVE",
) {
  const values =
    action === "READ"
      ? { read_at: new Date().toISOString() }
      : { archived_at: new Date().toISOString(), read_at: new Date().toISOString() };
  const { error } = await client
    .from("notifications")
    .update(values)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error("NOTIFICATION_UPDATE_FAILED");
  return { ok: true };
}
export async function markAllRead(client: Client, userId: string) {
  const { error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw new Error("NOTIFICATION_UPDATE_FAILED");
  return { ok: true };
}
