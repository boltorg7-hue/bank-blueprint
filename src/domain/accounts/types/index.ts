import type { DomainId, Money } from "../../_shared/types";
export type AccountStatus = "pending" | "active" | "frozen" | "closed";
export type Account = { id: DomainId; customerId: DomainId; currency: string; status: AccountStatus; balance: Money };
