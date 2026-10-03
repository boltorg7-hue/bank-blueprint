import type { StatementDto } from "../types";
export type StatementSummary = Pick<StatementDto, "reference" | "accountReference" | "periodStart" | "periodEnd" | "documentReference">;
