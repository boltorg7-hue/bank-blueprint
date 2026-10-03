import type { DomainId, Money } from "../../_shared/types";
export type TransferStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type Transfer = { id: DomainId; sourceAccountId: DomainId; destinationAccountId: DomainId; amount: Money; status: TransferStatus };
