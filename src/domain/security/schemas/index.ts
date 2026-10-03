import {z} from "zod";
export const securityDeviceSchema=z.object({deviceLabel:z.string().trim().min(2).max(240)});
export const securityActionSchema=z.enum(["login","password_change","mfa_change","session_revoke","sensitive_action"]);
