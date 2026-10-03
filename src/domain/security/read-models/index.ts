import type { SecurityEventDto } from "../types";
export type SecurityEventSummary = Pick<SecurityEventDto, "id" | "type" | "title" | "createdAt">;
