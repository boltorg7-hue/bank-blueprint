import type { CustomerContext } from "../types";
export type OnboardingSummary = Pick<CustomerContext, "email" | "emailVerified">;
