import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function assertCustomerConsent(userId: string): Promise<void> {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (authError || !authData.user) {
    throw new Error("CUSTOMER_AUTH_UNAVAILABLE");
  }

  const provider = authData.user.app_metadata?.provider;
  if (provider !== "google" && provider !== "apple") return;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("terms_accepted_at, privacy_accepted_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.terms_accepted_at || !data.privacy_accepted_at) {
    throw new Error("OAUTH_CONSENT_REQUIRED");
  }
}
