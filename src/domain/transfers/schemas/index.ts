import { z } from "zod";
export const transferStatusSchema = z.enum(["pending", "processing", "completed", "failed", "cancelled"]);
export const createTransferSchema = z.object({ sourceAccountId: z.string().min(1), destinationAccountId: z.string().min(1), amount: z.number().positive(), currency: z.string().length(3) });
