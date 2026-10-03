import {z} from "zod";export const statementRequestSchema=z.object({customerId:z.string().min(1),accountId:z.string().min(1),periodStart:z.string(),periodEnd:z.string()});
