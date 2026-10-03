import type { DomainEvent } from "../../_shared/types";
export type AccountCreatedEvent = DomainEvent<"accounts.account.created", { customerId: string; currency: string }>;
export type AccountStatusChangedEvent = DomainEvent<"accounts.account.status_changed", { status: "pending" | "active" | "frozen" | "closed" }>;
export type AccountEvent = AccountCreatedEvent | AccountStatusChangedEvent;
