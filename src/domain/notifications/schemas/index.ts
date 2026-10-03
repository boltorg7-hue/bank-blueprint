import {z} from "zod";
export const notificationIdSchema=z.string().uuid();
export const notificationActionSchema=z.object({id:notificationIdSchema,action:z.enum(["READ","ARCHIVE"])});
