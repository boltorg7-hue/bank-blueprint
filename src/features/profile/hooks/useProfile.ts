import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPreferences, getProfileOverview, savePermanentAddress, savePermanentProfile, savePreferences } from "@/features/profile/services/profile.functions";
import type { CustomerPreferencesDto } from "@/features/profile/types/profile";

const PROFILE_KEY = ["profile", "overview"] as const; const PREFERENCES_KEY = ["profile", "preferences"] as const;
export function useProfileOverview() { const fn = useServerFn(getProfileOverview); return useQuery({ queryKey: PROFILE_KEY, queryFn: () => fn() }); }
export function useSaveProfile() { const fn = useServerFn(savePermanentProfile); const qc = useQueryClient(); return useMutation({ mutationFn: (data: unknown) => fn({ data }), onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }) }); }
export function useSaveAddress() { const fn = useServerFn(savePermanentAddress); const qc = useQueryClient(); return useMutation({ mutationFn: (data: unknown) => fn({ data }), onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }) }); }
export function usePreferences() { const fn = useServerFn(getPreferences); return useQuery({ queryKey: PREFERENCES_KEY, queryFn: () => fn() }); }
export function useSavePreferences() { const fn = useServerFn(savePreferences); const qc = useQueryClient(); return useMutation({ mutationFn: (data: CustomerPreferencesDto) => fn({ data }), onSuccess: () => qc.invalidateQueries({ queryKey: PREFERENCES_KEY }) }); }
