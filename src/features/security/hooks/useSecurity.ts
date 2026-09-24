import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { closeOtherSecuritySessions,getSecurityOverview,recordPasswordChanged,registerSecuritySession } from "@/features/security/services/security.functions";
const KEY=["security","overview"] as const;
export function useSecurityOverview(){const fn=useServerFn(getSecurityOverview);return useQuery({queryKey:KEY,queryFn:()=>fn(),staleTime:10_000});}
export function useRegisterSecuritySession(){const fn=useServerFn(registerSecuritySession);const qc=useQueryClient();return useMutation({mutationFn:(deviceLabel:string)=>fn({data:{deviceLabel}}),onSuccess:()=>qc.invalidateQueries({queryKey:KEY})});}
export function useCloseOtherSessions(){const fn=useServerFn(closeOtherSecuritySessions);const qc=useQueryClient();return useMutation({mutationFn:()=>fn(),onSuccess:()=>qc.invalidateQueries({queryKey:KEY})});}
export function useRecordPasswordChanged(){const fn=useServerFn(recordPasswordChanged);const qc=useQueryClient();return useMutation({mutationFn:()=>fn(),onSuccess:()=>qc.invalidateQueries({queryKey:KEY})});}
