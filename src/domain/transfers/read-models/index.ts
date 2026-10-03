import type { TransferDto } from "../types";
export type TransferSummary = Pick<TransferDto, "reference" | "status" | "amountMinor" | "sourceAccountReference">;
