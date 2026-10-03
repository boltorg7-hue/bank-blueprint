import { QUERY_POLICY } from "@/lib/query-policy";
import { useQuery } from "@tanstack/react-query";

import { setUsdPerUsdt } from "@/config/currency";
import { applyLiveFees, type FeeCode } from "@/config/fees";
import { supabase } from "@/integrations/supabase/client";

export const LIVE_SETTINGS_KEY = ["financial-settings", "live"] as const;

/**
 * Reads the parity and fees published by the back-office and applies them to
 * the shared currency/fee configuration. Components calling this hook
 * re-render automatically when a new version is published.
 */
export function useLiveFinancialSettings() {
  return useQuery({
    queryKey: LIVE_SETTINGS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_setting_versions")
        .select("setting_key, numeric_value, version");
      if (error) throw error;
      const fees: Partial<Record<FeeCode, number>> = {};
      for (const row of data ?? []) {
        const v = Number(row.numeric_value);
        if (row.setting_key === "USD_PER_USDT") setUsdPerUsdt(v);
        else fees[row.setting_key as FeeCode] = v;
      }
      applyLiveFees(fees);
      return (data ?? []).map((r) => `${r.setting_key}:${r.version}`).join("|");
    },
    ...QUERY_POLICY.FINANCIAL,
    refetchInterval: 10_000,
  });
}
