export type NotificationDto = { id:string; category:string; severity:"INFO"|"SUCCESS"|"WARNING"|"CRITICAL"; title:string; body:string; resourcePath:string|null; readAt:string|null; createdAt:string };
export type NotificationCenterDto = { items:NotificationDto[]; unreadCount:number };
