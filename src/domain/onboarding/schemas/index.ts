import {z} from "zod";
export const onboardingStatusSchema=z.enum(["started","pending_review","approved","rejected"]);
export const startOnboardingSchema=z.object({customerId:z.string().min(1)});
