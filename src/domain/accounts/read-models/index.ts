import type { CustomerAccountSummaryDto } from "../types";
export type AccountSummary = Pick<CustomerAccountSummaryDto, "reference" | "displayName" | "currency" | "status" | "balance">;
