import { z } from "zod";
export const customerStatusSchema = z.enum(["prospect", "active", "suspended", "closed"]);
export const customerSchema = z.object({ id: z.string().min(1), status: customerStatusSchema, email: z.string().email(), displayName: z.string().min(1) });
