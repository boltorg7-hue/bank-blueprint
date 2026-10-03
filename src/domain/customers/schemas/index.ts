import {z} from "zod";
export const customerIdSchema=z.string().min(1);
export const customerEmailSchema=z.string().email().nullable();
export const customerSummarySchema=z.object({id:customerIdSchema,email:customerEmailSchema,firstName:z.string().nullable(),lastName:z.string().nullable(),lifecycleState:z.string().min(1),onboardingStep:z.string().min(1)});
export const customerContextSchema=z.object({email:z.string().email().nullable(),emailVerified:z.boolean(),profile:z.object({id:z.string().min(1)}).passthrough(),address:z.object({id:z.string().min(1)}).passthrough().nullable(),verification:z.object({id:z.string().min(1)}).passthrough(),documents:z.array(z.object({id:z.string().min(1)}).passthrough())});
