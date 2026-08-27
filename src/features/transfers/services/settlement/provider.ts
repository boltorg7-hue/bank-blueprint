/**
 * External settlement port (PROMPT 08 §51 – §55).
 *
 * The transfer domain never talks to a provider directly: it talks to this
 * interface. Provider vocabulary is mapped to canonical internal states before
 * it reaches any customer surface (§54, §1105).
 *
 * IMPORTANT — §15, §363: no rail connected in this environment performs a real
 * settlement. A simulated rail therefore NEVER reports SUCCEEDED on its own;
 * only an authoritative operational decision can finalise a transfer. Nothing
 * here may pretend that external money was delivered.
 */
import type { ExternalSettlementState } from "@/features/transfers/types/transfer";

export type SettlementSubmission = {
  transferReference: string;
  amountMinor: number;
  currency: string;
  /** Stable internal key: guarantees the same transfer is never sent twice (§74, §75). */
  idempotencyKey: string;
};

export type SettlementResult = {
  state: ExternalSettlementState;
  providerReference: string | null;
  /** True while no real settlement infrastructure backs this rail. */
  isSimulation: boolean;
};

export type ExternalTransferProvider = {
  key: string;
  displayName: string;
  isSimulation: boolean;
  submitTransfer(submission: SettlementSubmission): Promise<SettlementResult>;
  getTransferStatus(providerReference: string): Promise<SettlementResult>;
  cancelTransfer?(providerReference: string): Promise<SettlementResult>;
};

/**
 * Development rail: accepts the submission and stays PENDING for ever. It can
 * never move a transfer to 100 %, which keeps the 99 % state truthful.
 */
const simulatedDomesticRail: ExternalTransferProvider = {
  key: "SIMULATED_DOMESTIC_RAIL",
  displayName: "Rail domestique (simulation de développement)",
  isSimulation: true,
  async submitTransfer(submission) {
    return {
      state: "SUBMITTED",
      providerReference: `SIM-${submission.idempotencyKey.slice(0, 24)}`,
      isSimulation: true,
    };
  },
  async getTransferStatus(providerReference) {
    return { state: "PENDING", providerReference, isSimulation: true };
  },
};

const PROVIDERS: Record<string, ExternalTransferProvider> = {
  [simulatedDomesticRail.key]: simulatedDomesticRail,
};

export function getSettlementProvider(key: string): ExternalTransferProvider | null {
  return PROVIDERS[key] ?? null;
}
