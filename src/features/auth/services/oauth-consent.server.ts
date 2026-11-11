import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function assertCustomerConsent(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("terms_accepted_at, privacy_accepted_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.terms_accepted_at || !data.privacy_accepted_at) {
    throw new Error("OAUTH_CONSENT_REQUIRED");
  }
}
