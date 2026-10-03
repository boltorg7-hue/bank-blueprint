import {z} from "zod";
export const accountReferenceSchema=z.string().regex(/^ACC-\\d{4}-\\d{6}$/);
export const accountStatusSchema=z.enum(["PENDING","ACTIVE","RESTRICTED","SUSPENDED","FROZEN","CLOSING","CLOSED"]);
export const accountTypeSchema=z.enum(["CURRENT","SAVINGS"]);
export const accountDetailsInputSchema=z.object({reference:accountReferenceSchema});
