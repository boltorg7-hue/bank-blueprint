import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationCenterDto } from "@/features/notifications/types/notification";

type Client=SupabaseClient<any,any,any>;

export async function dispatchPendingSms(userId:string) {
  const { supabaseAdmin }=await import("@/integrations/supabase/client.server");
  const admin=supabaseAdmin as any;
  const { data:rows, error }=await admin
    .from("notification_outbox")
    .select("id,recipient,template_key,payload")
    .eq("user_id",userId)
    .eq("channel","SMS")
    .eq("status","PENDING")
    .limit(20);

  if (error) throw new Error("SMS_QUEUE_READ_FAILED");
  if (!rows?.length) return { processed: 0 };

  const providerName = process.env.SMS_PROVIDER?.trim().toLowerCase() || "simulation";
  const { africaTalkingSmsProvider } = providerName === "africastalking"
    ? await import("@/features/notifications/services/sms/africastalking-provider")
    : { africaTalkingSmsProvider: null };

  const provider = africaTalkingSmsProvider ?? (await import("@/features/notifications/services/sms/simulation-provider")).simulationSmsProvider;

  let processed = 0;
  for (const row of rows) {
    const result=await provider.send({
      recipient:row.recipient,
      templateKey:row.template_key,
      payload:row.payload??{},
    });

    const { error:updateError }=await admin
      .from("notification_outbox")
      .update({
        status:result.state,
        provider_reference:result.providerReference,
        attempts:1,
        processed_at:new Date().toISOString(),
        last_error_code:result.errorCode,
      })
      .eq("id",row.id)
      .eq("status","PENDING");

    if (updateError) throw new Error("SMS_QUEUE_UPDATE_FAILED");
    processed++;
  }

  return { processed };
}

export async function simulatePendingSms(userId:string) {
  const previousProvider=process.env.SMS_PROVIDER;
  process.env.SMS_PROVIDER="simulation";
  try {
    return await dispatchPendingSms(userId);
  } finally {
    if (previousProvider === undefined) delete process.env.SMS_PROVIDER;
    else process.env.SMS_PROVIDER=previousProvider;
  }
}

export async function loadNotifications(client:Client,userId:string):Promise<NotificationCenterDto> {

  const { data,error }=await client.from("notifications" as any).select("id,category,severity,title,body,resource_path,read_at,created_at").eq("user_id",userId).is("archived_at",null).order("created_at",{ascending:false}).limit(100);
  if(error) throw new Error("NOTIFICATIONS_UNAVAILABLE");
  const items=(data??[]).map((row:any)=>({id:row.id,category:row.category,severity:row.severity,title:row.title,body:row.body,resourcePath:row.resource_path??null,readAt:row.read_at??null,createdAt:row.created_at}));
  return {items,unreadCount:items.filter((item:any)=>!item.readAt).length};
}
export async function markNotification(client:Client,userId:string,id:string,action:"READ"|"ARCHIVE") {
  const values=action==="READ"?{read_at:new Date().toISOString()}:{archived_at:new Date().toISOString(),read_at:new Date().toISOString()};
  const {error}=await client.from("notifications" as any).update(values).eq("id",id).eq("user_id",userId); if(error) throw new Error("NOTIFICATION_UPDATE_FAILED"); return {ok:true};
}
export async function markAllRead(client:Client,userId:string) { const {error}=await client.from("notifications" as any).update({read_at:new Date().toISOString()}).eq("user_id",userId).is("read_at",null); if(error) throw new Error("NOTIFICATION_UPDATE_FAILED"); return {ok:true}; }
