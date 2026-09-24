import type { SupabaseClient } from "@supabase/supabase-js";
import type { SecurityOverviewDto } from "@/features/security/types/security";
type Client=SupabaseClient<any,any,any>;
export async function loadSecurityOverview(client:Client,userId:string,currentSessionId:string|null):Promise<SecurityOverviewDto>{
  const [{data:sessions,error:sessionError},{data:events,error:eventError}]=await Promise.all([
    client.from("customer_security_sessions").select("id,auth_session_id,device_label,first_seen_at,last_seen_at,revoked_at").eq("user_id",userId).order("last_seen_at",{ascending:false}).limit(20),
    client.from("customer_security_events").select("id,event_type,title,detail,created_at").eq("user_id",userId).order("created_at",{ascending:false}).limit(30),
  ]);
  if(sessionError||eventError)throw new Error("SECURITY_OVERVIEW_UNAVAILABLE");
  return {sessions:(sessions??[]).map((row:any)=>({id:row.id,deviceLabel:row.device_label,firstSeenAt:row.first_seen_at,lastSeenAt:row.last_seen_at,revokedAt:row.revoked_at??null,current:row.auth_session_id===currentSessionId})),events:(events??[]).map((row:any)=>({id:row.id,type:row.event_type,title:row.title,detail:row.detail,createdAt:row.created_at}))};
}
