import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CustomerPreferencesDto, ProfileOverviewDto } from "@/features/profile/types/profile";

export const getProfileOverview = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<ProfileOverviewDto> => {
  const service = await import("@/features/profile/services/profile.server");
  const email = typeof context.claims["email"] === "string" ? context.claims["email"] : null;
  return service.loadProfile(context.userId, email, Boolean(context.claims["email_confirmed_at"]));
});
export const savePermanentProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => input).handler(async ({ data, context }) => {
  const service = await import("@/features/profile/services/profile.server"); return service.updateProfile(context.userId, data);
});
export const savePermanentAddress = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => input).handler(async ({ data, context }) => {
  const service = await import("@/features/profile/services/profile.server"); return service.updateAddress(context.userId, data);
});
export const getPreferences = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<CustomerPreferencesDto> => {
  const service = await import("@/features/profile/services/profile.server"); return service.loadPreferences(context.userId);
});
export const savePreferences = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => input).handler(async ({ data, context }): Promise<CustomerPreferencesDto> => {
  const service = await import("@/features/profile/services/profile.server"); return service.updatePreferences(context.userId, data);
});
