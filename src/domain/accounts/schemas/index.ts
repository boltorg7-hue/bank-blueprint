import { z } from "zod";
export const accountIdSchema = z.string().min(1);
export const accountStatusSchema = z.enum(["pending", "active", "frozen", "closed"]);
export const createAccountSchema = z.object({ customerId: z.string().min(1), currency: z.string().length(3) });
