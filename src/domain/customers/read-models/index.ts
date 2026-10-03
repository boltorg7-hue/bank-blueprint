import type { Customer } from "../types";
export type CustomerSummary = Pick<Customer, "id" | "status" | "email" | "displayName">;
