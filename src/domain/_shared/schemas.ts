import { z } from "zod";

export const domainIdSchema = z.string().min(1);
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const moneySchema = z.object({ amount: z.number().finite(), currency: z.string().min(3).max(3) });
export const correlationIdSchema = z.string().min(1);
