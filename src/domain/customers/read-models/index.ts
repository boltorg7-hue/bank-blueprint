import type { Customer } from "../types";
export type CustomerOverview = Pick<Customer, "id" | "email">;
