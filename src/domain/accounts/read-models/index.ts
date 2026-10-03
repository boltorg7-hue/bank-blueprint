import type { Account } from "../types";
export type AccountSummary = Pick<Account, "id" | "customerId" | "currency" | "status" | "balance">;
