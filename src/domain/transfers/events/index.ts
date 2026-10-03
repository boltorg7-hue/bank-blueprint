import type { DomainEvent } from "../../_shared/types";
export type TransferCreatedEvent = DomainEvent<"transfers.transfer.created", { sourceAccountId: string; destinationAccountId: string; amount: number; currency: string }>;
export type TransferCompletedEvent = DomainEvent<"transfers.transfer.completed", { amount: number; currency: string }>;
export type TransferEvent = TransferCreatedEvent | TransferCompletedEvent;
