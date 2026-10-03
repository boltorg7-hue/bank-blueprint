import type { NotificationDto } from "../types";
export type NotificationSummary = Pick<NotificationDto, "id" | "category" | "title" | "readAt">;
