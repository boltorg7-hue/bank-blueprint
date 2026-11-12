import type { SupabaseClient } from "@supabase/supabase-js";

import { requireAdminPermission } from "@/features/admin/services/admin.server";
import { getSettlementProvider } from "@/features/transfers/services/settlement/provider";

type Client = SupabaseClient;

type QueueRow = {
  id: string;
  public_reference: string;
  amount_minor: number | string;
  currency: string;
  status: string;
  progress_percent: number;
  simulation_approved_by: string | null;
  simulation_submitted_by: string | null;
  rail: {
    provider_key: string;
    is_simulation: boolean;
  } | null;
};

export async function submitAdminExternalSettlement(
  client: Client,
  actorUserId: string,
  reference: string,
): Promise<{ ok: true }> {
  await requireAdminPermission(client, "transfers.approve");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("transfers")
    .select(
      "id,public_reference,amount_minor,currency,status,progress_percent,simulation_approved_by,simulation_submitted_by,rail:external_settlement_rails!transfers_settlement_rail_id_fkey(provider_key,is_simulation)",
    )
    .eq("public_reference", reference)
    .eq("transfer_kind", "EXTERNAL_TRANSFER")
    .maybeSingle();

  if (error || !data) throw new Error("TRANSFER_ACTION_FAILED");
  const row = data as unknown as QueueRow;

  if (
    row.status !== "APPROVED" ||
    row.progress_percent !== 95 ||
    !row.rail?.is_simulation ||
    row.simulation_approved_by === null ||
    row.simulation_approved_by === actorUserId ||
    row.simulation_submitted_by !== null
  ) {
    throw new Error("FOUR_EYES_REQUIRED");
  }

  const provider = getSettlementProvider(row.rail.provider_key);
  if (!provider || !provider.isSimulation) {
    throw new Error("SIMULATED_SETTLEMENT_PROVIDER_UNAVAILABLE");
  }

  const amountMinor = Number(row.amount_minor);
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new Error("INVALID_TRANSFER_AMOUNT");
  }

  const outcome = await provider.submitTransfer({
    transferReference: row.public_reference,
    amountMinor,
    currency: row.currency,
    idempotencyKey: "settlement:" + row.id,
  });

  if (
    !outcome.isSimulation ||
    !["SUBMITTED", "PENDING"].includes(outcome.state) ||
    !outcome.providerReference?.trim()
  ) {
    throw new Error("INVALID_SIMULATED_PROVIDER_RESULT");
  }

  const { error: queueError } = await supabaseAdmin.rpc(
    "admin_queue_simulated_external" as never,
    {
      _staff_id: actorUserId,
      _reference: reference,
      _provider_status: outcome.state,
      _provider_reference: outcome.providerReference,
    } as never,
  );
  if (queueError) {
    const message = queueError.message.toLowerCase();
    if (message.includes("four_eyes_required")) throw new Error("FOUR_EYES_REQUIRED");
    throw new Error("TRANSFER_ACTION_FAILED");
  }

  return { ok: true };
}
