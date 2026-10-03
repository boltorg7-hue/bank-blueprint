import type { DomainId } from "../../_shared/types";
export type CustomerStatus = "prospect" | "active" | "suspended" | "closed";
export type Customer = { id: DomainId; status: CustomerStatus; email: string; displayName: string };
