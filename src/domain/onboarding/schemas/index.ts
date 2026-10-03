import {z} from "zod";
export const documentIdSchema=z.string().min(1);
export const contactCodeSchema=z.object({code:z.string().min(1)});
export const documentActionSchema=z.object({documentId:documentIdSchema});
export const identityVerificationStatusSchema=z.enum(["NOT_STARTED","IN_PROGRESS","SUBMITTED","UNDER_REVIEW","ADDITIONAL_INFORMATION_REQUIRED","VERIFIED","REJECTED","EXPIRED"]);
