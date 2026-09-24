import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query"; import { useServerFn } from "@tanstack/react-start";
import { getNotifications,markEveryNotificationRead,updateNotification } from "@/features/notifications/services/notifications.functions";
export const NOTIFICATIONS_KEY=["notifications"] as const;
export function useNotifications(){const fn=useServerFn(getNotifications);return useQuery({queryKey:NOTIFICATIONS_KEY,queryFn:()=>fn(),staleTime:5_000,refetchInterval:30_000});}
export function useUpdateNotification(){const fn=useServerFn(updateNotification);const qc=useQueryClient();return useMutation({mutationFn:(data:{id:string;action:"READ"|"ARCHIVE"})=>fn({data}),onSuccess:()=>qc.invalidateQueries({queryKey:NOTIFICATIONS_KEY})});}
export function useMarkAllRead(){const fn=useServerFn(markEveryNotificationRead);const qc=useQueryClient();return useMutation({mutationFn:()=>fn(),onSuccess:()=>qc.invalidateQueries({queryKey:NOTIFICATIONS_KEY})});}
