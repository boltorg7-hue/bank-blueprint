import {z} from "zod";
export const documentReferenceSchema=z.string().regex(/^DOC-\\d{4}-\\d{8}$/);
export const customerDocumentTypeSchema=z.enum(["ACCOUNT_STATEMENT","TRANSFER_RECEIPT","TRANSACTION_RECEIPT","BANK_LETTER","ACCOUNT_CERTIFICATE"]);
export const documentListSchema=z.object({types:z.array(customerDocumentTypeSchema).optional(),limit:z.number().int().min(1).max(80).optional()});
export const documentReferenceInputSchema=z.object({reference:documentReferenceSchema});
