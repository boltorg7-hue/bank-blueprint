import {z} from "zod";
import {accountReferenceSchema} from "../../accounts/schemas";
export const statementReferenceSchema=z.string().regex(/^STM-\\d{4}-\\d{8}$/);
export const statementGenerationSchema=z.object({accountReference:accountReferenceSchema,periodStart:z.string().datetime(),periodEnd:z.string().datetime(),periodKind:z.enum(["MONTHLY","CUSTOM"])});
