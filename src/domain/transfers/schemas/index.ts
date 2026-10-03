import {z} from "zod";
import {accountReferenceSchema} from "../../accounts/schemas";
export const transferReferenceSchema=z.string().regex(/^TRF-\\d{4}-\\d{8}$/);
export const transferStatusSchema=z.enum(["DRAFT","READY_FOR_CONFIRMATION","CONFIRMED","FUNDS_RESERVED","PROCESSING","COMPLIANCE_REVIEW","DOCUMENT_REQUIRED","APPROVED","SETTLEMENT_PENDING","COMPLETED","FAILED","REJECTED","CANCELLED","BLOCKED","REVERSED"]);
export const transferLimitsInputSchema=z.object({currency:z.string().regex(/^[A-Z]{3}$/)});
export const initiateTransferSchema=z.object({sourceAccountReference:accountReferenceSchema,beneficiaryReference:z.string().min(1),amountMinor:z.number().int().positive(),customerReference:z.string().trim().max(500).optional()});
export const transferReferenceInputSchema=z.object({reference:transferReferenceSchema});
