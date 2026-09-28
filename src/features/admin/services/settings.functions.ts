import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const SETTING_KEYS = ["USD_PER_USDT", "ACCOUNT_MAINTENANCE_MONTHLY", "TRANSFER_INTERNAL", "TRANSFER_EXTERNAL"] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export interface SettingVersionDto {
  key: string;
  value: number;
  version: number;
  effectiveAt: string;
}

export const listFinancialSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SettingVersionDto[]> => {
    const service = await import("@/features/admin/services/admin.server");
    await service.requireAdminPermission(context.supabase);
    const { data, error } = await context.supabase
      .from("financial_setting_versions")
      .select("setting_key, numeric_value, version, effective_at")
      .order("version", { ascending: false })
      .limit(200);
    if (error) throw new Error("SETTINGS_LOAD_FAILED");
    return (data ?? []).map((r) => ({ key: r.setting_key, value: Number(r.numeric_value), version: r.version, effectiveAt: r.effective_at }));
  });

export const updateFinancialSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: SettingKey; value: number; expectedVersion: number }) => {
    if (!SETTING_KEYS.includes(input?.key)) throw new Error("INVALID_KEY");
    const value = Number(input.value);
    const expectedVersion = Number(input.expectedVersion);
    if (!Number.isFinite(value) || value < 0 || !Number.isSafeInteger(expectedVersion)) throw new Error("INVALID_VALUE");
    if (input.key !== "USD_PER_USDT" && !Number.isSafeInteger(value)) throw new Error("INVALID_VALUE");
    return { key: input.key, value, expectedVersion };
  })
  .handler(async ({ data, context }) => {
    const service = await import("@/features/admin/services/admin.server");
    await service.requireAdminPermission(context.supabase, "settings.manage");
    const { data: result, error } = await context.supabase.rpc("update_financial_setting", {
      _key: data.key,
      _value: data.value,
      _expected_version: data.expectedVersion,
    });
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("version") || m.includes("conflict")) throw new Error("VERSION_CONFLICT");
      if (m.includes("forbidden")) throw new Error("FORBIDDEN");
      throw new Error("SETTING_UPDATE_FAILED");
    }
    return result;
  });
