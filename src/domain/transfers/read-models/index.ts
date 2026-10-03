import type { Transfer } from "../types";
export type TransferSummary = Pick<Transfer, "id" | "sourceAccountId" | "destinationAccountId" | "amount" | "status">;
