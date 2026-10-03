import type { DomainEvent } from "../../_shared/types";
export type CustomerCreatedEvent = DomainEvent<"customers.customer.created", { email: string; displayName: string }>;
export type CustomerStatusChangedEvent = DomainEvent<"customers.customer.status_changed", { status: "prospect" | "active" | "suspended" | "closed" }>;
export type CustomerEvent = CustomerCreatedEvent | CustomerStatusChangedEvent;
